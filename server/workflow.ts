import type { ModelMessage } from "ai";
import { FatalError, getWorkflowMetadata } from "workflow";
import { runPipeline } from "../agents/foreman/pipeline";
import type { Role, Station } from "../agents/registry";
import type { TaskInput } from "../agents/task-input";
import {
  createSandbox,
  executeTool,
  initialMessages,
  modelStep,
  openDraftPullRequest,
  stopSandbox,
} from "./steps";

async function executeStation(
  role: Station,
  input: TaskInput
): Promise<Record<string, unknown>> {
  const sessionId = `${getWorkflowMetadata().workflowRunId}-${role}-${crypto.randomUUID().slice(0, 8)}`;
  const sandbox = await createSandbox(
    role,
    `a2a-${sessionId}`.toLowerCase().replaceAll("_", "-")
  );
  try {
    const messages: ModelMessage[] = await initialMessages(input);
    for (let step = 0; step < 40; step += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: Each model call depends on previous tool results.
      const result = await modelStep(role, sessionId, messages, false);
      messages.push(...result.messages);
      if (!result.calls.length) {
        const final = await modelStep(role, sessionId, messages, true);
        return final.output ?? {};
      }
      // Sequential tools prevent a brokered git credential overlapping model commands.
      for (const call of result.calls) {
        // biome-ignore lint/performance/noAwaitInLoops: Do not overlap brokered git operations with shell commands.
        const output = await executeTool(role, sandbox, call.name, call.input);
        messages.push({
          content: [
            {
              output: {
                type: "json",
                value: JSON.parse(JSON.stringify(output)),
              },
              toolCallId: call.id,
              toolName: call.name,
              type: "tool-result",
            },
          ],
          role: "tool",
        });
      }
    }
    throw new FatalError("Station exceeded its 40 model-call budget.");
  } finally {
    await stopSandbox(sandbox);
  }
}

export async function factoryWorkflow(
  role: Role,
  input: TaskInput
): Promise<Record<string, unknown>> {
  "use workflow";
  if (role !== "foreman") {
    return await executeStation(role, input);
  }
  return await runPipeline(input, executeStation, openDraftPullRequest);
}
