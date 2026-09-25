import type { JSONSchema7 } from "ai";
import type { z } from "zod";
import type { TaskInput } from "./task-input.js";

export type StationTool =
  | "bash"
  | "read_artifact"
  | "save_artifact"
  | "checkout_branch"
  | "push_branch";

interface AgentContract {
  description: string;
  inputSchema: z.ZodType<TaskInput>;
  // Explicit on every role; caller trust is still resolved by agent/lib/trust.ts.
  requiresTrust: boolean;
}

export interface StationDefinition extends AgentContract {
  kind: "station";
  outputSchema: JSONSchema7;
  reasoning: "medium" | "high" | "provider-default";
  sandbox: "none" | "shell" | "repository";
  tools: readonly StationTool[];
}

export interface OrchestratorDefinition extends AgentContract {
  kind: "orchestrator";
  reasoning: "medium" | "high" | "provider-default";
}
