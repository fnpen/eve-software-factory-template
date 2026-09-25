import { defineInstructions } from "eve/instructions";
import { readStationInstructions } from "../../../agents/instructions.js";

export default defineInstructions({
  content: await readStationInstructions("analyst"),
});
