import type { ModelMessage } from "ai";
import type { Station } from "../agents/registry";
import type { TaskInput } from "../agents/task-input";

// Keep provider, sandbox and Node.js imports inside steps, outside the workflow VM.
export async function modelStep(
  role: Station,
  id: string,
  messages: ModelMessage[],
  final: boolean
) {
  "use step";
  return (await import("./stations")).modelStep(role, id, messages, final);
}
export async function initialMessages(input: TaskInput) {
  "use step";
  return (await import("./stations")).initialMessages(input);
}
export async function createSandbox(role: Station, name: string) {
  "use step";
  return (await import("./tools")).createSandbox(role, name);
}
export async function stopSandbox(name: string | null) {
  "use step";
  return (await import("./tools")).stopSandbox(name);
}
export async function executeTool(
  role: Station,
  sandbox: string | null,
  name: string,
  input: unknown
) {
  "use step";
  return (await import("./tools")).executeTool(role, sandbox, name, input);
}
executeTool.maxRetries = 0;
export async function openDraftPullRequest(
  workItem: string,
  analysis: Record<string, unknown>,
  implementation: Record<string, unknown>,
  review: Record<string, unknown>
) {
  "use step";
  return (await import("./github")).openDraftPullRequest(
    workItem,
    analysis,
    implementation,
    review
  );
}
