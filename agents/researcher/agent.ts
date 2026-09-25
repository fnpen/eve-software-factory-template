import { defineAgent } from "eve";
import { MODELS } from "#lib/models.js";
import definition from "./definition.js";

export default defineAgent({
  description: definition.description,
  model: MODELS.researcher,
  outputSchema: definition.outputSchema,
  reasoning: definition.reasoning,
});
