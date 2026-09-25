import { defineEvalConfig } from "eve/evals";
import { litellm } from "../agent/lib/litellm.js";

/**
 * Run-wide eval configuration.
 *
 * @remarks
 * The judge model scores `t.judge.*` assertions only; it never changes the
 * agent under test. Kimi grades independently of the Astra-powered agents.
 * Run the default loop with `pnpm eval --tag fast`; see the
 * README's evals section for the full matrix.
 */
export default defineEvalConfig({
  judge: { model: litellm("kimi-k3") },
});
