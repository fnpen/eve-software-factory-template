import type { Station } from "../registry.js";
import type { TaskInput } from "../task-input.js";

export type RunStation = (
  role: Station,
  input: TaskInput
) => Promise<Record<string, unknown>>;
export type DeliverDraft = (
  workItem: string,
  analysis: Record<string, unknown>,
  implementation: Record<string, unknown>,
  review: Record<string, unknown>
) => Promise<Record<string, unknown>>;

// Pipeline policy is independent of Workflow, model providers and GitHub clients.
export async function runPipeline(
  input: TaskInput,
  runStation: RunStation,
  deliver: DeliverDraft
): Promise<Record<string, unknown>> {
  const classification = await runStation("classifier", input);
  if (
    classification.needs_clarification === true ||
    classification.actionable === false
  ) {
    return { classification, status: "needs_clarification" };
  }
  const research = input.researchQuestion
    ? await runStation("researcher", { workItem: input.researchQuestion })
    : input.research;
  const analysis = await runStation("analyst", {
    ...input,
    classification,
    research,
  });
  let implementation = await runStation("implementer", {
    ...input,
    analysis,
    classification,
  });
  for (let revision = 0; revision <= 2; revision += 1) {
    if (implementation.pushed !== true) {
      return { implementation, status: "implementation_failed" };
    }
    // biome-ignore lint/performance/noAwaitInLoops: Review must inspect the latest revision.
    const review = await runStation("reviewer", {
      ...input,
      analysis,
      base: String(implementation.base),
      branch: String(implementation.branch),
      implementation,
    });
    if (review.verdict === "approve") {
      const pullRequest = await deliver(
        input.workItem,
        analysis,
        implementation,
        review
      );
      return {
        analysis,
        classification,
        implementation,
        pullRequest,
        review,
        status: "draft_created",
      };
    }
    if (review.verdict !== "request_changes" || revision === 2) {
      return { implementation, review, status: "review_failed" };
    }
    implementation = await runStation("implementer", {
      ...input,
      analysis,
      branch: String(implementation.branch),
      classification,
      findings: [review],
      implementation,
    });
  }
  return { status: "review_failed" };
}
