import { generateText, jsonSchema, type ModelMessage, Output } from "ai";
import Ajv from "ajv";
import { createFactoryModel, MODEL_IDS } from "../agent/lib/models.js";
import { readStationInstructions } from "../agents/instructions.js";
import { type Station, stations } from "../agents/registry.js";
import type { TaskInput } from "../agents/task-input.js";
import { stationTools } from "./tools.js";

export async function modelStep(
  role: Station,
  sessionId: string,
  messages: ModelMessage[],
  final: boolean
) {
  const definition = stations[role];
  const validate = new Ajv({ strict: false }).compile<Record<string, unknown>>(
    definition.outputSchema
  );
  const instructions = await readStationInstructions(role);
  const result = await generateText({
    maxOutputTokens: 8000,
    messages,
    model: createFactoryModel(MODEL_IDS[role], sessionId),
    output: final
      ? Output.object({
          schema: jsonSchema<Record<string, unknown>>(definition.outputSchema, {
            validate: (value) =>
              validate(value)
                ? { success: true, value }
                : {
                    error: new Error("Invalid station output"),
                    success: false,
                  },
          }),
        })
      : undefined,
    reasoning:
      definition.reasoning === "provider-default"
        ? undefined
        : definition.reasoning,
    system:
      definition.sandbox === "none"
        ? instructions
        : `${instructions}\nUse bash for file reads, edits, search, verification and web access in your isolated sandbox. Never run background processes.`,
    timeout: 180_000,
    tools: final ? undefined : stationTools(role),
  });
  return {
    calls: result.toolCalls.map((call) => ({
      id: call.toolCallId,
      input: call.input,
      name: call.toolName,
    })),
    messages: result.response.messages,
    output: final ? result.output : undefined,
  };
}

export async function initialMessages(
  input: TaskInput
): Promise<ModelMessage[]> {
  const { readDocument } = await import("../agent/lib/blob.js");
  const { factoryBrainKey } = await import("../agent/lib/factory-brain.js");
  const brain = await readDocument(factoryBrainKey());
  return [
    {
      content: JSON.stringify({
        ...input,
        factoryBrain: brain.found ? brain.content : null,
      }),
      role: "user",
    },
  ];
}
