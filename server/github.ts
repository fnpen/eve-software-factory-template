import { FatalError } from "workflow";
import { FACTORY_REPO } from "../agent/lib/constants.js";
import { githubCredentials } from "../agent/lib/github/credentials.js";
import {
  mintInstallationToken,
  validateBranch,
} from "../agent/lib/github/git-remote.js";

export async function openDraftPullRequest(
  workItem: string,
  analysis: Record<string, unknown>,
  implementation: Record<string, unknown>,
  review: Record<string, unknown>
) {
  const branch = String(implementation.branch);
  if (
    review.verdict !== "approve" ||
    implementation.pushed !== true ||
    validateBranch(branch) ||
    !branch.startsWith("factory/")
  ) {
    throw new FatalError("A reviewed factory branch is required.");
  }
  const token = await mintInstallationToken(githubCredentials);
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const api = `https://api.github.com/repos/${FACTORY_REPO}`;
  // Reconcile an earlier successful create before retrying the step.
  const existing = await fetch(
    `${api}/pulls?state=open&head=${encodeURIComponent(`${FACTORY_REPO.split("/")[0]}:${branch}`)}`,
    { headers }
  );
  if (!existing.ok) {
    throw new Error("Could not check existing pull requests.");
  }
  const pulls = (await existing.json()) as {
    html_url: string;
    draft: boolean;
  }[];
  if (pulls.length) {
    return { draft: pulls[0].draft, url: pulls[0].html_url };
  }
  const response = await fetch(`${api}/pulls`, {
    body: JSON.stringify({
      base: String(implementation.base),
      body: `## Plan\n\n${String(analysis.problem_statement ?? "")}\n\n${String(analysis.approach ?? "")}\n\n## Verification and review\n\n\`\`\`json\n${JSON.stringify({ review, verification: implementation.verification }, null, 2)}\n\`\`\``,
      draft: true,
      head: branch,
      title: workItem.split("\n")[0].slice(0, 120),
    }),
    headers,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Draft creation failed (${response.status}).`);
  }
  const pull = (await response.json()) as { html_url: string };
  return { draft: true, url: pull.html_url };
}
