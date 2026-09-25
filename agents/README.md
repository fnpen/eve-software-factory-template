# Agent definitions

Each agent owns one folder. Edit behavior here, not in the eve discovery adapters under `agent/`.

```text
agents/
  contracts.ts          # small, typed contracts for stations and the orchestrator
  registry.ts           # explicit catalog; derives role names and route validation
  task-input.ts         # shared input envelope and acceptance-criteria check
  instructions.ts       # shared Markdown reader for both runtimes
  foreman/
    definition.ts       # description, input validation, trust requirement
    agent.ts            # eve model, reasoning and session budget
    instructions.ts     # eve orchestration prompt, with FACTORY_REPO injection
    pipeline.ts         # A2A pipeline policy; accepts station/delivery functions
    channels/           # eve GitHub, Linear and route authentication
    connections/        # eve Linear MCP connection
    extensions/         # eve GitHub extension and approval configuration
    sandbox.ts
    tools/
    skills/             # Markdown packages, including their reference files
    skills.ts           # build-time adapter for those packages
  classifier/
  researcher/
  analyst/
  implementer/
  reviewer/
    definition.ts       # description, input/output contracts, reasoning, capabilities
    agent.ts            # eve configuration using the shared definition and model map
    instructions.md     # single prompt source for both runtimes
    sandbox.ts          # optional eve sandbox definition
    tools/              # optional eve tool implementations
```

The station shape shown under `reviewer/` applies to all five stations. Classifier needs no authored sandbox or tools. Researcher uses eve's default web tools, plus its artifact saver; A2A supplies shell-based web access instead.

## Boundaries

- `definition.ts` contains role policy and schemas, not provider clients, credentials, or execution code. Importing the registry must not load environment configuration or provision a sandbox.
- `agent.ts` adapts the definition to eve. Models remain centralized in `agent/lib/models.ts`; the implementer and reviewer must use different vendors.
- `agent/` keeps eve's required filesystem layout. Its modules forward to these folders, load station Markdown, or load Foreman's skill packages. An extension adapter imports and calls the extension package directly, passing configuration from the owning agent folder. eve statically resolves the package from the mount module, so it cannot forward a mounted extension through a local re-export.
- `server/` owns A2A transport, authentication, durable execution, and shared tool/sandbox implementations. Tool advertisement and execution authorization read the same role-local allowlist. Trust decisions still use `agent/lib/trust.ts`.
- `agent/lib/` remains the shared infrastructure layer for models, trust, Git safety, Blob storage, and sandbox bootstrap. It is not owned by any one agent.
- `foreman/pipeline.ts` owns pipeline order and the two-revision limit. It knows no HTTP, Workflow, provider, or GitHub client APIs; callers inject station execution and draft delivery.

This is one deployment with explicit modules, not a plugin framework. Both runtimes share station contracts and prompts, but keep their existing differences in tools and orchestration. Foreman's A2A endpoint runs the fixed pipeline, not its eve prompt.

## Add a station

1. Copy the smallest suitable station folder. Set its `definition.ts` description, input schema, output schema, reasoning, A2A sandbox mode, explicit `requiresTrust`, and tool allowlist. Grant only the tools it needs. Add new shared input fields in `task-input.ts` only when needed; the envelope stays strict.
2. Write its `instructions.md`. Keep the instructions self-contained and mention only available capabilities.
3. Add its model assignment in `agent/lib/models.ts` and select that assignment in the folder's `agent.ts`.
4. Import the definition and add it to `stations` in `registry.ts`. A2A role validation, cards, authorization, and execution then use that entry without another role switch.
5. Add `agent/subagents/<role>/` discovery adapters for its agent, instructions, and any tools or sandbox. Those paths determine eve identity; `agents/<role>/` alone does not expose it to eve.
6. Extend `server/tools.ts` and `contracts.ts` only if it needs a capability that does not exist. Apply the existing trust and Git/Blob guards. Do not put approval-gated tools in task-mode stations.
7. Decide explicitly whether Foreman should invoke it. Registration does not change the pipeline. Update `foreman/pipeline.ts` for A2A and `foreman/instructions.ts` for eve if needed.
8. Update the catalog/capability expectations in `tests/agents.test.ts` and add behavior tests. Run `pnpm test:a2a`, `pnpm validate`, and `pnpm a2a:build`. Ensure discovery reports zero errors and warnings; `eve info` can exit successfully while reporting a failed compile.

Station Markdown is read from the project root. `next.config.ts` traces `agents/*/instructions.md` into deployed A2A functions; keep this pattern in sync if the layout changes. Foreman's skill packages are embedded by eve at build time, including their reference files.
