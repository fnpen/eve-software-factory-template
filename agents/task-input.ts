import { z } from "zod";

// Direct callers provide the context that Foreman normally assembles.
export const taskInputSchema = z
  .object({
    analysis: z.record(z.string(), z.unknown()).optional(),
    base: z.string().max(200).optional(),
    branch: z.string().max(200).optional(),
    classification: z.record(z.string(), z.unknown()).optional(),
    findings: z.array(z.unknown()).max(100).optional(),
    implementation: z.record(z.string(), z.unknown()).optional(),
    research: z.record(z.string(), z.unknown()).optional(),
    researchQuestion: z.string().max(4000).optional(),
    workItem: z.string().min(1).max(40_000),
  })
  .strict();
export type TaskInput = z.infer<typeof taskInputSchema>;

export const hasAcceptanceCriteria = (input: TaskInput): boolean =>
  Array.isArray(input.analysis?.acceptance_criteria) &&
  input.analysis.acceptance_criteria.length > 0;
