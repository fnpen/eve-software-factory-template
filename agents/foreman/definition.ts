import type { OrchestratorDefinition } from "../contracts.js";
import { taskInputSchema } from "../task-input.js";

export default {
  description:
    "Run classification, planning, implementation and independent review, then open a draft pull request.",
  inputSchema: taskInputSchema,
  kind: "orchestrator",
  reasoning: "medium",
  requiresTrust: true,
} satisfies OrchestratorDefinition;
