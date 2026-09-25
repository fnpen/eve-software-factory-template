import { z } from "zod";
import analyst from "./analyst/definition.js";
import classifier from "./classifier/definition.js";
import foreman from "./foreman/definition.js";
import implementer from "./implementer/definition.js";
import researcher from "./researcher/definition.js";
import reviewer from "./reviewer/definition.js";
import type { TaskInput } from "./task-input.js";

// Explicit imports keep the catalog inspectable and bundler-friendly. No runtime scanning.
export const stations = {
  analyst,
  classifier,
  implementer,
  researcher,
  reviewer,
};
export const agents = { foreman, ...stations };
export type Role = keyof typeof agents;
export type Station = keyof typeof stations;

export const roles = Object.keys(agents) as Role[];
export const roleSchema = z.enum(roles);

export const validateTaskInput = (role: Role, value: unknown): TaskInput =>
  agents[role].inputSchema.parse(value);
