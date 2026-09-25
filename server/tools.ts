import { Sandbox } from "@vercel/sandbox";
import { type ToolSet, tool } from "ai";
import { FatalError } from "workflow";
import { z } from "zod";
import {
  ARTIFACT_KINDS,
  MAX_ARTIFACT_LENGTH,
  MAX_ARTIFACT_TITLE_LENGTH,
} from "../agent/lib/artifacts/config.js";
import {
  readArtifactTool,
  saveArtifactTool,
} from "../agent/lib/artifacts/tools.js";
import { sanitizeCommandOutput } from "../agent/lib/github/bootstrap-diagnostics.js";
import { githubCredentials } from "../agent/lib/github/credentials.js";
import {
  brokerPolicy,
  mintInstallationToken,
  REMOTE_URL,
  validateBranch,
} from "../agent/lib/github/git-remote.js";
import type { StationTool } from "../agents/contracts.js";
import { type Station, stations } from "../agents/registry.js";

const readSchema = z.object({ id: z.string().min(1).max(200) });
const saveSchema = z.object({
  kind: z.enum(ARTIFACT_KINDS),
  markdown: z.string().min(1).max(MAX_ARTIFACT_LENGTH),
  title: z.string().min(1).max(MAX_ARTIFACT_TITLE_LENGTH),
});
const commandSchema = z.object({ command: z.string().min(1).max(20_000) });
const branchSchema = z.object({ branch: z.string().min(1).max(200) });

const toolDefinitions = {
  bash: tool({
    description:
      "Run a foreground shell command in the isolated sandbox. Output is bounded. No credentials are available there.",
    inputSchema: commandSchema,
  }),
  checkout_branch: tool({
    description:
      "Fetch and check out a feature branch from the configured repository.",
    inputSchema: branchSchema,
  }),
  push_branch: tool({
    description:
      "Push a feature branch to the configured repository. Protected branches are refused.",
    inputSchema: branchSchema,
  }),
  read_artifact: tool({
    description: readArtifactTool().description,
    inputSchema: readSchema,
  }),
  save_artifact: tool({
    description: saveArtifactTool().description,
    inputSchema: saveSchema,
  }),
} satisfies Record<StationTool, ToolSet[string]>;

export const stationTools = (role: Station): ToolSet =>
  Object.fromEntries(
    stations[role].tools.map((name) => [name, toolDefinitions[name]])
  );

const run = async (sandbox: Sandbox, command: string) => {
  const result = await sandbox.runCommand({
    args: ["180s", "bash", "-lc", command],
    cmd: "timeout",
    cwd: "/workspace/repo",
  });
  return {
    exitCode: result.exitCode,
    stderr: sanitizeCommandOutput((await result.stderr()).slice(-8000)),
    stdout: sanitizeCommandOutput((await result.stdout()).slice(-24_000)),
  };
};

const checked = async (sandbox: Sandbox, command: string) => {
  const result = await run(sandbox, command);
  if (result.exitCode !== 0) {
    throw new Error(`Sandbox command failed: ${result.stderr}`);
  }
  return result;
};

export async function createSandbox(
  role: Station,
  name: string
): Promise<string | null> {
  const { sandbox: mode } = stations[role];
  if (mode === "none") {
    return null;
  }
  // Stable name makes a retried provisioning step reuse the same sandbox.
  const sandbox = await Sandbox.getOrCreate({
    keepLastSnapshots: { count: 1, deleteEvicted: true },
    name,
    resources: { vcpus: 4 },
    runtime: "node24",
    snapshotExpiration: 14 * 24 * 60 * 60 * 1000,
    timeout: 30 * 60 * 1000,
  });
  await sandbox.runCommand({
    args: ["-p", "/workspace/repo"],
    cmd: "mkdir",
    sudo: true,
  });
  await sandbox.runCommand({
    args: ["777", "/workspace/repo"],
    cmd: "chmod",
    sudo: true,
  });
  if (mode === "shell") {
    return sandbox.name;
  }
  const token = await mintInstallationToken(githubCredentials);
  await sandbox.updateNetworkPolicy(brokerPolicy(token));
  try {
    await checked(
      sandbox,
      `test -d .git || git clone --depth 50 ${REMOTE_URL} .`
    );
  } finally {
    await sandbox.updateNetworkPolicy("allow-all");
  }
  await checked(
    sandbox,
    "git config user.name 'foreman[bot]' && git config user.email 'foreman[bot]@users.noreply.github.com'"
  );
  if (process.env.FACTORY_SETUP_COMMAND) {
    await checked(sandbox, process.env.FACTORY_SETUP_COMMAND);
  }
  return sandbox.name;
}

export async function stopSandbox(name: string | null) {
  if (name) {
    await (await Sandbox.get({ name })).stop();
  }
}

export async function executeTool(
  role: Station,
  sandboxName: string | null,
  name: string,
  input: unknown
) {
  // Never automatically replay arbitrary commands after an ambiguous failure.
  try {
    if (!Object.hasOwn(stationTools(role), name)) {
      throw new Error("Tool is not available to this role.");
    }
    if (name === "read_artifact") {
      const definition = readArtifactTool();
      return await definition.execute(
        readSchema.parse(input),
        undefined as never
      );
    }
    if (name === "save_artifact") {
      const definition = saveArtifactTool();
      return await definition.execute(
        saveSchema.parse(input),
        undefined as never
      );
    }
    if (!sandboxName) {
      throw new Error("This role has no sandbox.");
    }
    const sandbox = await Sandbox.get({ name: sandboxName });
    if (name === "bash") {
      return await run(sandbox, commandSchema.parse(input).command);
    }
    const { branch } = branchSchema.parse(input);
    const refusal = validateBranch(branch);
    if (refusal) {
      throw new Error(refusal);
    }
    const token = await mintInstallationToken(githubCredentials);
    await sandbox.updateNetworkPolicy(brokerPolicy(token));
    try {
      if (name === "push_branch") {
        if (!branch.startsWith("factory/")) {
          throw new Error("Only factory/* branches may be pushed.");
        }
        const defaultBranch = await checked(
          sandbox,
          `git ls-remote --symref ${REMOTE_URL} HEAD`
        );
        if (defaultBranch.stdout.includes(`ref: refs/heads/${branch}\tHEAD`)) {
          throw new Error("Cannot push the default branch.");
        }
        await checked(
          sandbox,
          `git -c core.hooksPath=/dev/null push ${REMOTE_URL} refs/heads/${branch}:refs/heads/${branch}`
        );
        return { branch, pushed: true };
      }
      return await checked(
        sandbox,
        `git fetch ${REMOTE_URL} refs/heads/${branch} && git checkout -B ${branch} FETCH_HEAD`
      );
    } finally {
      await sandbox.updateNetworkPolicy("allow-all");
    }
  } catch {
    // biome-ignore lint/style/useErrorCause: Do not persist credentials or command output in workflow errors.
    throw new FatalError(
      `Tool ${name} failed. Inspect the server run before retrying side effects.`
    );
  }
}
