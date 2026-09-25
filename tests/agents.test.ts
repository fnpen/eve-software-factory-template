import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import Ajv from "ajv";
import type { StationDefinition } from "../agents/contracts.js";
import { readStationInstructions } from "../agents/instructions.js";
import {
  agents,
  roleSchema,
  roles,
  stations,
  validateTaskInput,
} from "../agents/registry.js";

process.env.FACTORY_REPO = "test/scratch";
process.env.LINEAR_CONNECTOR = "linear/test";
const { agentCard } = await import("../server/a2a.js");
const { authorizeRole } = await import("../server/auth.js");
const { stationTools, executeTool } = await import("../server/tools.js");
const { MODEL_IDS } = await import("../agent/lib/models.js");
const { stampTrusted } = await import("../agent/lib/trust.js");

const expectedRoles = [
  "analyst",
  "classifier",
  "foreman",
  "implementer",
  "researcher",
  "reviewer",
];

test("the explicit catalog matches agent folders and rejects unknown routes", async () => {
  const folders = (await readdir("agents", { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual([...roles].sort(), expectedRoles);
  assert.deepEqual(folders, expectedRoles);
  for (const value of [
    "unknown",
    "../foreman",
    "constructor",
    "toString",
    "__proto__",
    "Foreman",
    "",
  ]) {
    assert.equal(roleSchema.safeParse(value).success, false);
  }
});

test("eve and A2A consume the same station schemas, reasoning and instructions", async () => {
  const ajv = new Ajv({ strict: false });
  await Promise.all(
    Object.entries(stations).map(async ([role, definition]) => {
      const { default: eve } = await import(
        `../agent/subagents/${role}/agent.js`
      );
      const { default: instructions } = await import(
        `../agent/subagents/${role}/instructions.js`
      );
      const markdown = await readStationInstructions(
        roleSchema.parse(role) as keyof typeof stations
      );
      assert.deepEqual(eve.outputSchema, definition.outputSchema);
      assert.equal(eve.reasoning, definition.reasoning);
      assert.equal(eve.description, definition.description);
      assert.equal(instructions.content, markdown);
      assert.ok(markdown.trim().length > 0);
      assert.equal(ajv.compile(definition.outputSchema)({}), false);
    })
  );
  assert.notEqual(MODEL_IDS.implementer, MODEL_IDS.reviewer);
});

test("cards and authorization read each agent's explicit contract", () => {
  const auth = {
    attributes: {},
    authenticator: "test",
    principalId: "alice",
    principalType: "user" as const,
  };
  for (const role of roles) {
    assert.equal(
      agentCard(role, "https://factory.example").description,
      agents[role].description
    );
    assert.equal(
      authorizeRole(role, auth),
      !["foreman", "implementer"].includes(role)
    );
    assert.equal(authorizeRole(role, stampTrusted(auth)), true);
  }
});

test("role-local validation preserves valid contexts and rejects missing requirements", () => {
  for (const role of [
    "foreman",
    "classifier",
    "researcher",
    "analyst",
  ] as const) {
    assert.deepEqual(validateTaskInput(role, { workItem: "Plan it" }), {
      workItem: "Plan it",
    });
  }
  const implementation = {
    analysis: { acceptance_criteria: ["The check passes"] },
    classification: { type: "bug" },
    workItem: "Fix it",
  };
  const review = {
    ...implementation,
    base: "main",
    branch: "factory/fix",
    implementation: { pushed: true },
  };
  assert.deepEqual(
    validateTaskInput("implementer", implementation),
    implementation
  );
  assert.deepEqual(validateTaskInput("reviewer", review), review);
  for (const [role, input, required] of [
    ["implementer", implementation, ["classification", "analysis"]],
    ["reviewer", review, ["analysis", "implementation", "branch", "base"]],
  ] as const) {
    for (const field of required) {
      assert.throws(() =>
        validateTaskInput(role, { ...input, [field]: undefined })
      );
    }
    for (const analysis of [
      {},
      { acceptance_criteria: [] },
      { acceptance_criteria: "not an array" },
    ]) {
      assert.throws(() => validateTaskInput(role, { ...input, analysis }));
    }
  }
  for (const role of roles) {
    assert.throws(() => validateTaskInput(role, { ...review, trusted: true }));
    assert.throws(() => validateTaskInput(role, { ...review, workItem: "" }));
    assert.throws(() =>
      validateTaskInput(role, { ...review, workItem: "x".repeat(40_001) })
    );
  }
});

test("capability allowlists preserve sandbox isolation and deny unlisted execution", async () => {
  const expected = {
    analyst: ["bash", "read_artifact", "save_artifact"],
    classifier: [],
    implementer: ["bash", "read_artifact", "checkout_branch", "push_branch"],
    researcher: ["bash", "save_artifact"],
    reviewer: ["bash", "read_artifact", "checkout_branch"],
  };
  await Promise.all(
    (Object.keys(stations) as (keyof typeof stations)[]).map(async (role) => {
      const definition: StationDefinition = stations[role];
      assert.deepEqual(Object.keys(stationTools(role)), expected[role]);
      assert.equal(definition.sandbox === "none", role === "classifier");
      assert.equal(definition.sandbox === "shell", role === "researcher");
      assert.equal(
        definition.sandbox !== "none",
        definition.tools.includes("bash")
      );
      const eveTools =
        role === "classifier"
          ? []
          : (await readdir(`agents/${role}/tools`)).sort();
      const discoveryTools =
        role === "classifier"
          ? []
          : (await readdir(`agent/subagents/${role}/tools`)).sort();
      assert.deepEqual(discoveryTools, eveTools);
    })
  );
  await assert.rejects(() =>
    executeTool("reviewer", null, "push_branch", { branch: "factory/fix" })
  );
  await assert.rejects(() =>
    executeTool("classifier", null, "bash", { command: "echo bad" })
  );
});

test("Foreman's skill adapters retain descriptions, bodies and reference files", async () => {
  const { loadForemanSkill } = await import("../agents/foreman/skills.js");
  await Promise.all(
    (
      ["github-linear-bridging", "triaging-issues", "writing-quality"] as const
    ).map(async (name) => {
      const skill = await loadForemanSkill(name);
      const source = await readFile(
        `agents/foreman/skills/${name}/SKILL.md`,
        "utf8"
      );
      assert.ok(skill.description);
      assert.equal(skill.markdown, source.split("\n").slice(3).join("\n"));
      await Promise.all(
        Object.entries(skill.files ?? {}).map(async ([path, content]) => {
          assert.equal(
            content,
            await readFile(`agents/foreman/skills/${name}/${path}`, "utf8")
          );
        })
      );
      assert.equal(
        Object.keys(skill.files ?? {}).length,
        {
          "github-linear-bridging": 0,
          "triaging-issues": 1,
          "writing-quality": 2,
        }[name]
      );
    })
  );
});

test("Next.js packages shared station Markdown for deployed workflow steps", async () => {
  const config = await readFile("next.config.ts", "utf8");
  assert.ok(config.includes('"./agents/*/instructions.md"'));
  assert.equal(config.includes("./agent/subagents/"), false);
});
