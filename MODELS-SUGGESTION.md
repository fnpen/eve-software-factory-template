# Model suggestions

These are starting recommendations, not measured rankings on this repository. Model access and proxy aliases must be configured separately. The balanced profile below is implemented; the first suggestion is saved as an alternative, not an automatic fallback.

## First suggestion: mixed models with Fable 5.1

| Station | Model | Suggested reasoning | Role |
| --- | --- | --- | --- |
| classifier | GPT-5.6 Luna (`gpt-5.6-luna`) | Low | Bounded triage and structured classification |
| orchestrator | GPT-5.6 Terra (`gpt-5.6-terra`) | Medium | Coordinate stations, tools, and handoffs |
| researcher | GPT-5.6 Terra (`gpt-5.6-terra`) | Medium | Investigate outside facts; use Astra for difficult research |
| analyst | GPT-6 Astra (`gpt-6-astra`) | High | Plan changes, acceptance criteria, dependencies, and failure modes |
| implementer | GPT-6 Astra (`gpt-6-astra`) | High; `xhigh` for difficult changes | Implement, debug, and verify |
| reviewer | Claude Fable 5.1 (`claude-fable-5-1`) | High | Independent review from a different model vendor |

Fable 5.1 is optional and requires separate access; it is not available through the current Codex Pro and OpenCode Go subscriptions. Kimi K3 (`kimi-k3`) through OpenCode Go is the optional replacement reviewer, using provider-default reasoning. Kimi K2.7 Code (`kimi-k2.7-code`) is another candidate to evaluate, not an automatic fallback. Keep the implementer and reviewer on different underlying model vendors.

## Latest suggestion: balanced quality (implemented)

Use Astra throughout the main pipeline, with medium effort for coordination and high effort for substantive work. Keep Kimi as the independent reviewer.

| Station | Model | Access | eve reasoning |
| --- | --- | --- | --- |
| classifier | GPT-6 Astra (`gpt-6-astra`) | Codex Pro through the proxy | `medium` |
| orchestrator | GPT-6 Astra (`gpt-6-astra`) | Codex Pro through the proxy | `medium` |
| researcher | GPT-6 Astra (`gpt-6-astra`) | Codex Pro through the proxy | `high` |
| analyst | GPT-6 Astra (`gpt-6-astra`) | Codex Pro through the proxy | `high` |
| implementer | GPT-6 Astra (`gpt-6-astra`) | Codex Pro through the proxy | `high` |
| reviewer | Kimi K3 (`kimi-k3`) | OpenCode Go through the proxy | `provider-default` |

Models are assigned in `agent/lib/models.ts`. Reasoning is set in each `agents/<role>/definition.ts` and used by both runtimes. The eve adapters in `agents/<role>/agent.ts` select the centralized model assignments. No automatic escalation or model fallback is configured.

- Consider `xhigh` for ambiguous architecture, concurrency or security changes, difficult debugging, or a failed revision.
- Reserve Astra's provider-native `max` for a specific unresolved problem after `xhigh`. The installed eve version does not accept `max` in its top-level `reasoning` field; it needs a supported provider-specific configuration.
- Keep Kimi on its provider default. Do not send OpenAI effort labels unless the Kimi route explicitly supports them.
- Evaluate review findings and escaped defects before changing models; more reasoning is not a guarantee of better results.

## LiteLLM routing and credentials

Set `LITELLM_BASE_URL` (including `/v1`) and `LITELLM_API_KEY` in the gitignored `.env.local` and in deployment environment settings. Use a restricted LiteLLM virtual key. Never commit credentials.

The application sends OpenAI-compatible Chat Completions requests to two aliases:

- `gpt-6-astra`: configure this alias on LiteLLM to use your Codex-authenticated backend, such as an OMP auth gateway backed by Codex credentials. Codex Pro is not OpenAI API credit; routing to a normal OpenAI API-key backend is billed separately.
- `kimi-k3`: configure this alias to use OpenCode Go at `https://opencode.ai/zen/go/v1`, not the separately billed Zen endpoint at `/zen/v1`. Keep the Go key on the proxy.

Both routes must support streaming, tool calls, structured outputs, and usage reporting. The Astra route must preserve `reasoning_effort`; the Kimi route must preserve `reasoning_content` across tool turns. The client sends `User-Agent: foreman/0.0.0` and a stable per-session `x-opencode-session` header; configure LiteLLM to forward them to Go. Each station has its own session identifier.

Function tools always carry an explicit boolean `strict`: missing values default to `false`, while an explicitly configured `true` or `false` is preserved. This prevents LiteLLM's Chat Completions-to-Responses bridge from forwarding `strict: null` to backends that reject it, without requiring every tool schema to satisfy strict-mode constraints.

Model credentials are read when a model step starts. Missing credentials fail the turn before any provider request; discovery does not need them. There is no Vercel Gateway or OpenAI API fallback. Context windows are declared explicitly for Astra (1,050,000 tokens) and Kimi K3 (1,048,576 tokens), so eve does not need a Vercel catalog lookup for these proxy aliases.

The eval judge in `evals/evals.config.ts` also uses LiteLLM, with the `kimi-k3` alias. The standalone `index.mts` example uses `gpt-6-astra`. Both require `LITELLM_BASE_URL` and `LITELLM_API_KEY`; the virtual key must permit both aliases. Run the example with `node --env-file=.env.local index.mts`. Neither entrypoint requires AI Gateway credentials.

During local verification, eve 0.39.3 displayed an "AI Gateway credentials missing" setup banner for these dynamic models, but the submitted turn correctly resolved through the LiteLLM handler. A `MODEL_SELECTION_FAILED` error naming `LITELLM_API_KEY` or `LITELLM_BASE_URL` means those runtime variables are missing; replacing the model through `/model` is not the fix.

## Sources

- [GPT-6 Astra model and supported reasoning levels](https://developers.openai.com/api/docs/models/gpt-6-astra)
- [OpenAI model catalog](https://developers.openai.com/api/docs/models/all)
- [Claude model comparison and Fable 5.1](https://platform.claude.com/docs/en/models/overview)
- [Codex subscription access and separate API billing](https://developers.openai.com/codex/pricing)
- [OpenCode Go models and client requirements](https://opencode.ai/docs/go/)
- [Models.dev provider and context-window metadata](https://models.dev/api.json)