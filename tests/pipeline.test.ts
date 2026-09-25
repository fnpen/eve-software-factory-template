import assert from "node:assert/strict";
import { test } from "node:test";
import { runPipeline } from "../agents/foreman/pipeline.js";
import type { Station } from "../agents/registry.js";
import type { TaskInput } from "../agents/task-input.js";

const noDelivery = () => {
  throw new Error("Unapproved work must not create a draft");
};

test("Foreman relays optional research and revision context without runtime dependencies", async () => {
  const calls: { role: Station; input: TaskInput }[] = [];
  const classification = { actionable: true };
  const research = { artifact_id: "research-notes-test" };
  const analysis = {
    acceptance_criteria: ["The test passes"],
    artifact_id: "analysis-test",
  };
  const implementation = { base: "main", branch: "factory/fix", pushed: true };
  const review = {
    blocking_findings: ["Add the missing test"],
    verdict: "request_changes",
  };
  let reviews = 0;
  const result = await runPipeline(
    { researchQuestion: "Check upstream behavior", workItem: "Fix the bug" },
    (role, input) => {
      calls.push({ input, role });
      switch (role) {
        case "classifier":
          return Promise.resolve(classification);
        case "researcher":
          return Promise.resolve(research);
        case "analyst":
          return Promise.resolve(analysis);
        case "implementer":
          return Promise.resolve(implementation);
        case "reviewer":
          reviews += 1;
          return Promise.resolve(
            reviews === 1 ? review : { verdict: "approve" }
          );
        default:
          throw new Error("Unexpected station");
      }
    },
    (workItem, plan, report, verdict) => {
      assert.equal(workItem, "Fix the bug");
      assert.deepEqual(plan, analysis);
      assert.deepEqual(report, implementation);
      assert.equal(verdict.verdict, "approve");
      return Promise.resolve({ draft: true });
    }
  );
  assert.equal(result.status, "draft_created");
  assert.deepEqual(
    calls.map(({ role }) => role),
    [
      "classifier",
      "researcher",
      "analyst",
      "implementer",
      "reviewer",
      "implementer",
      "reviewer",
    ]
  );
  assert.deepEqual(calls[1].input, { workItem: "Check upstream behavior" });
  assert.deepEqual(calls[2].input.research, research);
  assert.deepEqual(calls[3].input.analysis, analysis);
  assert.deepEqual(calls[3].input.classification, classification);
  assert.deepEqual(calls[4].input.implementation, implementation);
  assert.equal(calls[4].input.base, "main");
  assert.deepEqual(calls[5].input.findings, [review]);
  assert.equal(calls[5].input.branch, "factory/fix");
  assert.deepEqual(calls[5].input.analysis, analysis);
});

test("Foreman stops on failed pushes and rejected review without delivery", async () => {
  const failedCalls: Station[] = [];
  const failed = await runPipeline(
    { workItem: "Fix" },
    (role) => {
      failedCalls.push(role);
      return Promise.resolve({ pushed: false });
    },
    noDelivery
  );
  assert.equal(failed.status, "implementation_failed");
  assert.deepEqual(failedCalls, ["classifier", "analyst", "implementer"]);

  const rejectedCalls: Station[] = [];
  const rejected = await runPipeline(
    { workItem: "Fix" },
    (role) => {
      rejectedCalls.push(role);
      return Promise.resolve(
        role === "implementer"
          ? { base: "main", branch: "factory/fix", pushed: true }
          : { verdict: "reject" }
      );
    },
    noDelivery
  );
  assert.equal(rejected.status, "review_failed");
  assert.deepEqual(rejectedCalls, [
    "classifier",
    "analyst",
    "implementer",
    "reviewer",
  ]);
});
