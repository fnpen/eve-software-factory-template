# Independent agents with A2A access

Status: draft for review. The intent is confirmed; the execution adapter still has a framework feasibility gate. This document is a proposed design, not a claim that the installed framework already supports it.

Related: [confirmed intent](../intent/independent-a2a-agents.md) and [current architecture](../../.github/ARCHITECTURE.md).

## 1. Scope and recommendation

Expose six agents in one deployed service: Foreman, classifier, researcher, analyst, implementer, and reviewer. Keep the current declared-subagent folders as the canonical specialist implementations. Keep native delegation inside Foreman. Add one public A2A transport adapter at the application boundary, not an HTTP server or deployment per specialist.

A2A is the external protocol, not a replacement for eve's execution engine. The adapter validates requests, selects an allowlisted agent, starts an isolated durable task, and maps task status and results back to A2A. It must not call Foreman's model merely to persuade it to delegate to the requested specialist.

Do not rearrange the entire repository, duplicate agent trees, build an orchestration framework, or replace existing GitHub and Linear intake as part of this change. The configured `FACTORY_REPO` remains the target; arbitrary caller-selected repositories are not included.

## 2. Verified framework and repository findings

The installed package is `eve@0.39.3`. Installed docs and exported types take precedence over examples indexed from newer upstream code.

| Finding | Evidence | Consequence |
| --- | --- | --- |
| Declared specialists already have their own instructions, tools, state, and repo sandboxes where authored. | eve `docs/subagents/index.mdx`; `agent/subagents/` | Retain these definitions rather than creating separate public copies. |
| `defineRemoteAgent` calls `/eve/v1/session` with eve-specific dispatch and callbacks. | eve `docs/guides/remote-agents.md` | This is not A2A support. Renaming those routes would not implement A2A. |
| Custom channels are root-only. | eve `docs/channels/custom.mdx` | Put the transport in `agent/channels/a2a.ts`, not in specialist folders. |
| Public channel send options include mode and output schema but no target-agent selector. | eve `dist/src/channel/channel-operations.d.ts` and `session.d.ts`, re-exported by `eve/channels` | Direct specialist execution from a route is not established by the current public API. This is the main feasibility gate. |
| The installed package has no documented A2A channel or A2A export. | eve `package.json`, bundled docs and declarations | Expect an A2A SDK adapter, not a configuration-only change. |
| Named multi-agent hosting exists in `eve/next`, but describes generated per-agent services. | eve `dist/src/public/next/index.d.ts` | It does not establish the requested single-service architecture. Do not add Next.js solely for this feature. |
| All five specialists declare output schemas, and several assume full upstream reports. | `agent/subagents/*/agent.ts` and `instructions.md` | Independence requires prompt and result-contract changes, not only HTTP routes. |
| Analyst, implementer, and reviewer use session-scoped repo setup; classifier and researcher have no authored repo sandbox. | Specialist folders and `agent/lib/github/repo-sandbox.ts` | Preserve lightweight agents. Report missing capabilities honestly instead of silently giving every agent every tool. |
| Fresh implementation branches use a task-derived slug without a unique execution suffix. | Implementer instructions | Isolated sandboxes alone do not prevent concurrent remote-branch collisions. |
| Several write tools rely on trusted intake rather than universally denying anonymous calls. | `push_branch.ts`, `agent/lib/github/approval.ts`, Linear connection | Public access cannot safely be treated as merely a route change. |
| Handoff artifacts share a Blob namespace, and Blob documents currently use public access. | `agent/lib/artifacts/`, `agent/lib/blob.ts` | Execution isolation is not tenant confidentiality. Do not promise private public-task data. |

The official A2A JavaScript SDK is `@a2a-js/sdk`; the package registry returned version `1.2.1` during inspection. Its current documentation shows both A2A 1.0 and legacy 0.3 wire formats. The proposed target is A2A 1.0 over JSON-RPC. Verify and pin the SDK and matching protocol version during the feasibility work; do not mix legacy `message/send` shapes with 1.0 `SendMessage` shapes.

## 3. Architecture

```text
External A2A client
  -> root A2A channel: routing, validation, protocol mapping
  -> execution adapter: allowlisted target, fresh durable task
  -> canonical Foreman or specialist definition
  -> agent's own tools, model, instructions, state, and sandbox

Existing GitHub / Linear / eve clients
  -> Foreman
  -> native declared-subagent delegation
  -> the same canonical specialist definitions
```

The transport owns protocol concerns. Each agent owns its behavior and result schema. Shared helpers own reusable tool implementations and repository access. No model chooses which specialist a specialist URL actually runs.

### Proposed source layout

```text
agent/
  agent.ts                         # Foreman, unchanged location
  instructions.ts
  channels/
    a2a.ts                         # HTTP channel for all six public agents
    eve.ts                         # existing protected eve API remains separate
    github.ts
    linear.ts
  lib/
    a2a/                           # protocol mapping and execution adapter
    tools/                         # shared tool factories, explicit mounts only
    artifacts/                     # existing shared document behavior
    github/                        # existing brokered repository access
    models.ts                      # centralized model assignments remain here
    trust.ts                       # sole trust authority
  subagents/
    <specialist>/
      agent.ts
      instructions.md
      sandbox.ts                   # only where the role needs it
      tools/                       # agent-only tools or thin shared-tool mounts
      lib/                         # agent-specific contracts/helpers if needed
```

This is a proposed organization, not a list of files to create unconditionally. Avoid speculative registries or factories. A small allowlist can map public IDs to framework identities, but it must not become a second source for agent prompts, models, or tool membership. `foreman` is a transport alias for the root, not a new `name` field on its definition.

Shared tools belong under `agent/lib/tools/` and are explicitly mounted by thin files in each consuming agent's `tools/`. Putting shared implementations directly in root `agent/tools/` would expose them to Foreman automatically. Existing artifact tool factories already demonstrate the desired pattern. Consolidate genuinely shared checkout logic; leave trivial framework wrappers alone unless moving them provides a real benefit.

## 4. Framework feasibility gate

Before feature implementation, prove that the public transport can execute one existing specialist directly with its complete compiled definition, fresh session state, its own sandbox, its declared output schema, cancellation, and durable completion. A root channel calling `from(...).send(...)` alone starts the root agent, not an arbitrary specialist.

The preferred solution is a supported eve entry point that starts an allowlisted compiled local agent as a task. No such entry point was found in the installed public API. A compatible framework release or a small upstream API addition may be necessary. Do not assume importing `agent.ts` alone loads the instructions, tools, sandbox, and remaining filesystem capabilities.

If this cannot be demonstrated, stop and review the trade-off before writing the adapter. Alternatives require explicit approval: a maintained framework change, or multiple hosted agent roots/services with shared source modules. Do not silently replace direct specialist execution with an extra Foreman model call, deep imports into eve internals, copied agent folders, symlink-dependent discovery, or an independently maintained model loop.

The proof must use supported APIs and verify the deployed build as well as local execution. Latest upstream multi-agent workspace examples are not evidence that `eve@0.39.3` implements those APIs.

## 5. External contract

### Addresses and discovery

Proposed transport routes:

- `GET /a2a/<agent>/.well-known/agent-card.json`: public card for that agent.
- `POST /a2a/<agent>`: its JSON-RPC endpoint.
- Agent allowlist: `foreman`, `classifier`, `researcher`, `analyst`, `implementer`, `reviewer`.

Clients can receive each card URL explicitly. Cards advertise the exact endpoint, specialist role, supported protocol version, accepted content, and only implemented capabilities. Path and card interoperability must be tested against the selected SDK. No unadvertised claim that every client automatically discovers all six agents from the host root.

Minimum protocol surface: send a message, retrieve a task, and cancel a task. Use the selected SDK's actual method names and validation. Start with asynchronous task submission and polling; streaming, push notifications, uploads, and ongoing conversations are not required for the first version. Unsupported methods and parts receive protocol errors, not apparent success.

### Task input

Accept a text task and optional structured context: source branch, comparison base, supplied acceptance criteria, upstream reports, and explicit artifact references. Validate and bound these inputs. Neither classification nor an analyst's report is mandatory. The server chooses the target from the route and assigns task identity; caller metadata cannot override execution identity, trust, model, tool membership, or credentials.

A new accepted task gets a fresh execution session. A supplied A2A context ID must not merge independent tasks into one writable checkout. Task lookup and cancellation are bound to both agent ID and task ID. Unknown targets and task IDs fail without starting model work. Do not accept arbitrary callback URLs or fetch arbitrary attachment URLs in this initial contract.

### Specialist results

Use a common logical outcome with agent-owned validated data:

- `completed`: the role finished; includes its existing structured result.
- `blocked`: work cannot proceed; includes a concise reason, missing context/capability, and any useful partial result.
- Runtime failure: surfaced by the execution adapter separately from a model-declared blocker.

Map these outcomes into valid A2A task states using the pinned SDK. A blocker is terminal for this one-shot contract, not an indefinitely parked approval or clarification request. Preserve the explanation in the task result. A review requesting changes is a completed review, not an execution failure. Likewise, a completed classification may conclude that clarification is needed.

Update Foreman's handoff handling alongside any specialist schema changes so it cannot interpret a blocked task as a completed implementation. A2A result artifacts are protocol output objects; existing Blob handoff artifacts are a separate storage mechanism.

## 6. Independent role behavior

| Agent | Standalone behavior |
| --- | --- |
| Foreman | Coordinates the existing pipeline through native delegation; respects blockers and the bounded review loop. |
| Classifier | Classifies the supplied work item without requiring upstream context; returns questions when the task is unclear. No implementation work. |
| Researcher | Researches a supplied question using its existing web capabilities; reports unverifiable facts and inaccessible source material. No mandatory repo clone. |
| Analyst | Inspects its checkout, derives necessary classification/context, and produces a plan without requiring a classifier report. Can inspect a supplied validated source branch. |
| Implementer | Inspects the task and checkout and forms its own plan when no plan was supplied. Records assumptions, implements, verifies, and reports delivery accurately. Publication remains subject to the unresolved write policy. |
| Reviewer | Reads a supplied branch and real diff without requiring analyst or implementer reports. Uses supplied criteria when present, distinguishes inferred criteria, and reports missing intent rather than inventing a specification. Never edits the implementation. |

Keep existing model assignments, including the different vendors for implementer and reviewer. Branch selection must preserve literal remote URLs, brokered credentials, bounded validation, and protected-branch restrictions. Do not weaken `validateBranch` simply to support an optional base reference; any separate read-only ref support needs its own constrained contract.

## 7. Concurrency and durability

The acceptance target is ten different tasks for the same agent, not ten messages sharing a session. Each task needs a unique execution session, conversation, result, and writable sandbox where applicable. Immutable templates and shared definitions may be reused; live checkouts may not.

Fresh implementation branches need a unique task suffix. Revisions intentionally targeting the same branch require conflict handling, not force pushes or a claim that session isolation solves repository contention. Artifact writes must remain unique and non-overwriting; explicit handoff references are the only intended cross-task context sharing.

eve remains responsible for durable execution. Task identity, agent/session mapping, terminal status, and result retrieval must survive a new server instance and a disconnected HTTP client. Prefer deriving task status from eve's durable events rather than maintaining a competing lifecycle. If an additional mapping store is necessary, select it during the feasibility gate and prove atomic identity allocation, retry behavior, and cancellation/completion races. Do not use the SDK's in-memory task store or an unawaited background promise as production durability.

Define duplicate-message behavior with the pinned SDK and actual durable store. Do not advertise exactly-once execution without proving the dispatch/mapping crash boundary. Set explicit per-task execution budgets for standalone agents; they cannot rely on Foreman's parent budget. Public access still carries cost-abuse risk without admission controls.

## 8. Public access and unresolved permissions

No authentication is required on the new A2A endpoints. Existing eve, GitHub, and Linear route protection stays intact. The A2A boundary supplies only server-derived anonymous/untrusted context and never accepts caller-supplied trust stamps or forwarded principals. Any public-caller predicate belongs in `agent/lib/trust.ts`, not scattered tool-specific checks.

Public write permissions remain undecided by user request. That is a deployment gate, not permission to expose existing credentials unchanged:

- `push_branch` currently has no caller gate.
- Closing/reopening issues and creating draft PRs have paths allowed for every caller who can reach the tools today.
- Shared-brain policies may request approval for anonymous callers; public one-shot tasks must not be stranded waiting for it.
- App-scoped Linear credentials and root tools also need a public-call policy, including calls delegated through Foreman.
- Anonymous preference calls must not accidentally share one writable user-preference identity.

Recommend exercising the architecture with fake integrations or a disposable public repository until a public capability policy is approved. Public production access to real repository writes is not authorized by this spec. A read-only or sandbox-only public profile would also be a deliberate follow-up decision, not a silent interpretation of the confirmed intent.

There is a separate read-exposure risk: agents can disclose configured repository contents and shared context. Unauthenticated task IDs are not authenticated ownership, and the existing public Blob store does not provide tenant confidentiality. This stage offers execution separation, not a secure multi-tenant service. Do not deploy it with private repository or sensitive task data without resolving that exposure. No authentication system is added in this phase.

## 9. Acceptance and verification

1. One service serves valid cards and protocol endpoints for all six agents; each card works with the selected official SDK client.
2. A specialist endpoint runs that canonical specialist without an orchestrator model hop. A change to its instructions or tool implementation affects both native and A2A invocation.
3. Ten same-agent tasks execute concurrently with distinct sessions and isolated writable checkouts/results. Cancelling one does not cancel or redirect another.
4. Task retrieval and terminal results survive a new server instance; cancellation and completion races do not produce contradictory terminal states.
5. Analyst and implementer accept work without upstream reports; reviewer accepts a task and branch without an implementer report. Unresolvable missing context produces an explicit blocker, not fabricated success.
6. Foreman's existing pipeline and review-cycle ceiling remain intact. Blockers stop dependent stages.
7. Unknown agents, malformed requests, oversized content, invalid branch refs, cross-agent task IDs, and forged trust metadata are rejected before inappropriate work starts.
8. Existing credential brokering, protected-branch checks, artifact containment, and authenticated intake remain intact. No public write capability is enabled by omission.
9. `pnpm validate` reports zero errors and warnings. Add protocol/adapter tests with fake execution and separately exercise the dev TUI. Real model, sandbox, CI, and branch-push tests require deliberate execution against a scratch repository.

Testing layers: deterministic protocol and contract tests without model calls; integration tests for task mapping, durable resume, and cancellation; mocked ten-task concurrency tests; then a controlled real-sandbox concurrency smoke test. Existing evals remain the regression layer for Foreman routing and safety, not a substitute for protocol tests.

## 10. Decisions before implementation planning

The recommended architecture is native internal delegation plus a single external A2A adapter over the same agent definitions. Approval of this draft permits planning the feasibility work first, not assuming its result.

Remaining gates:

- A supported direct-specialist execution entry point in the installed or explicitly approved eve version.
- Matching A2A SDK/protocol pin and a durable task mapping strategy demonstrated with that entry point.
- A public capability and data-exposure decision before connecting anonymous traffic to real production resources. Authentication itself remains out of scope.

A detailed task breakdown follows spec approval. No application behavior, dependencies, route permissions, or deployment configuration were changed while drafting this document.

## Sources

- Installed eve docs: `docs/subagents/index.mdx`, `docs/channels/custom.mdx`, `docs/channels/eve.mdx`, `docs/guides/remote-agents.md`, `docs/guides/auth-and-route-protection.md`, and `docs/guides/deployment/vercel.mdx`, all under `node_modules/eve/`.
- Installed public API declarations: `node_modules/eve/dist/src/channel/channel-operations.d.ts`, `node_modules/eve/dist/src/channel/session.d.ts`, and `node_modules/eve/dist/src/public/next/index.d.ts`.
- [eve upstream](https://github.com/vercel/eve), checked through Context7; upstream examples differ from the installed package and are not assumed available.
- [Official A2A JavaScript SDK](https://github.com/a2aproject/a2a-js), including version compatibility examples, task storage, and cancellation documentation, checked through Context7.
- Repository source paths referenced throughout this document.
