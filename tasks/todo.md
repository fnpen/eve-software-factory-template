# Independent A2A agents: task checklist

Status: planned, not implemented. See [plan.md](./plan.md) for architecture, gates, risks, and verification discipline. Spec approval and plan review precede Task 01. No checkbox below claims existing execution evidence.

## Shared verification contract

For every code task, run its focused tests plus `pnpm test` once Task 04 provides it, `pnpm validate`, and `pnpm build`; inspect edited TypeScript diagnostics. Record commands and outcomes with the task before marking it complete. For native behavior changes, exercise `pnpm dev`; model-backed evals and live integrations require deliberate scratch-environment approval. Commit each verified code slice separately. Do not rerun successful commands on unchanged code. If a task grows beyond five files, split it before implementing.

Tasks 01-03 are feasibility work, not feature implementation. A failure or unavailable live environment leaves the gate blocked. Proposed proof/test paths below are planning names, not APIs that have already been verified.

## Task 01: Audit supported direct dispatch

Description: Recheck installed public APIs and identify the smallest supported way to dispatch a complete canonical specialist. Verify candidate A2A SDK/protocol compatibility without changing dependencies.

Acceptance criteria:
- [ ] Record supported entry-point evidence, including compiled capability loading, sandbox, output schema, standalone limits, cancellation, and durable status access; distinguish verified facts from missing capabilities.
- [ ] Record exact candidate eve/SDK/protocol versions and identify a possible durable mapping approach with duplicate-message and dispatch-crash questions.
- [ ] If the entry point is unavailable, stop and request an explicit framework/version/design decision; do not use deep imports or a Foreman hop.

Verification: Review installed exports/types and official SDK documentation; record reproducible inspection commands and evidence in the feasibility note. Run `pnpm check` for documentation changes. No live model invocation needed.

Dependencies: Human approval of feasibility scope and review of this plan.

Files likely touched: `docs/specs/independent-a2a-agents-feasibility.md` (new); `docs/specs/independent-a2a-agents.md` (findings only).

Estimated scope: Small, 1-2 documentation files.

## Task 02: Prove local canonical execution

Description: Build a minimal non-public proof using an existing sandboxed specialist, preferably analyst, through the supported API found in Task 01.

Acceptance criteria:
- [ ] Invoke analyst directly with its compiled instructions, own tools/model, sandbox, and validated output, without invoking Foreman's model or copying definitions.
- [ ] Two different tasks receive distinct execution state and checkouts; a controlled canonical instruction change is observed through both native and direct invocation, then removed.
- [ ] Record exact local proof commands, approved runtime budget, and results; no anonymous route is enabled against real resources.

Verification: Typecheck and build the proof; use approved disposable resources to run native and direct executions. Record identities and capability observations without secrets. Run the shared verification commands that exist at this point.

Dependencies: 01 successful; explicit approval for any required eve version change and live calls.

Files likely touched: `scripts/a2a-feasibility.ts` (new proof entry); feasibility note; `package.json` and `pnpm-lock.yaml` only if an approved change is needed.

Estimated scope: Medium, up to 4 files.

## Task 03: Prove deployed durable lifecycle

Description: Extend the proof to a disposable deployment, including restart-safe task identity, terminal retrieval, cancellation, and retry behavior. This is not production rollout.

Acceptance criteria:
- [ ] A disconnected client and a new server instance can retrieve the same agent/task mapping and terminal result from durable state.
- [ ] Cancellation is confirmed through runtime evidence; duplicate dispatch and cancel/completion races have a documented, tested outcome, including crash boundaries.
- [ ] Record the selected durable mapping strategy and SDK/protocol pin, deployed build evidence, and remaining limitations; reject in-memory production storage and background promises as durability.

Verification: Run approved scratch deployment experiments with process/client interruption and competing completion/cancel events. Record exact build, deployment, and probe commands. No deployment command runs without explicit approval.

Dependencies: 02; approved scratch deployment and budget.

Files likely touched: proof entry; feasibility note; one proof-only mapping module if required; spec findings.

Estimated scope: Medium, up to 4 files; split any required durable-store provisioning into a reviewed prerequisite.

## Checkpoint A: Feasibility decision

- [ ] Review Tasks 01-03 evidence and approve the supported execution, lifecycle, and mapping strategy.
- [ ] Confirm one deployment and canonical agent reuse still hold; otherwise stop for a revised spec.
- [ ] Review the remaining task estimates against the proven API before any feature implementation.

## Task 04: Establish offline tests

Description: Add the smallest TypeScript-compatible deterministic test harness, keeping model evals separate.

Acceptance criteria:
- [ ] `pnpm test` runs without model credentials, remote calls, or discovery-time production environment requirements.
- [ ] Document an exact focused-file command and include a failing-then-passing smoke assertion demonstrating the harness detects regressions.
- [ ] Keep test files outside eve-discovered capability directories and avoid unnecessary dependencies.

Verification: `pnpm test`, the documented focused command, `pnpm validate`, and `pnpm build`.

Dependencies: Checkpoint A.

Files likely touched: `package.json`; `pnpm-lock.yaml` if needed; `tests/harness.test.ts`; test configuration only if necessary.

Estimated scope: Medium, up to 4 files.

## Task 05: Classifier outcomes and Foreman consumption

Description: Establish the completed/blocked result pattern using classifier, updating Foreman atomically rather than changing every station at once.

Acceptance criteria:
- [ ] Classifier returns validated completed data or a terminal blocker with reason and missing context; ordinary clarification questions remain a completed classification.
- [ ] Foreman recognizes migrated results while still accepting the other stations' current shapes and never advances from a blocker.
- [ ] Contract fixtures reject malformed outcomes; native clarification behavior and the two-revision ceiling are preserved.

Verification: Focused classifier/consumer contract tests, shared code checks, and approved native TUI/eval cases for completed, clarification, and blocked results.

Dependencies: 04.

Files likely touched: classifier `agent.ts`, `instructions.md`, optional `lib/result.ts`; `agent/instructions.ts`; `tests/classifier-outcomes.test.ts`.

Estimated scope: Medium, up to 5 files.

## Task 06: Independent researcher outcomes

Description: Apply the proven result pattern to research tasks without adding repository capabilities.

Acceptance criteria:
- [ ] A standalone question needs no upstream report; unverifiable facts and inaccessible sources are reported honestly, with blockers when work cannot proceed.
- [ ] Existing citations and artifact references remain validated; Foreman consumes completed or blocked research correctly.
- [ ] No repo sandbox or unrelated tools are added.

Verification: Focused result fixtures, shared checks, and approved native standalone/delegated research cases.

Dependencies: 05.

Files likely touched: researcher `agent.ts`, `instructions.md`, optional `lib/result.ts`; root instructions; `tests/researcher-outcomes.test.ts`.

Estimated scope: Medium, up to 5 files.

## Checkpoint B: Outcome pattern

- [ ] Completed, blocked, malformed, and clarification fixtures pass.
- [ ] Native delegation uses the canonical definitions and handles mixed migrated/unmigrated results safely.
- [ ] Review schema pattern and prompt evidence before continuing.

## Task 07: Standalone analyst planning

Description: Let analyst plan from a work item and its default checkout without a mandatory classifier report.

Acceptance criteria:
- [ ] Analyst derives necessary context, records assumptions, and returns a plan with acceptance criteria without upstream reports.
- [ ] Missing essential intent yields a validated blocker with useful partial information, not an invented specification.
- [ ] Foreman consumes the new outcome and preserves artifact handoffs.

Verification: Analyst schema fixtures, shared checks, and approved TUI cases with supplied and absent classification.

Dependencies: Checkpoint B.

Files likely touched: analyst `agent.ts`, `instructions.md`, optional `lib/result.ts`; root instructions; `tests/analyst-outcomes.test.ts`.

Estimated scope: Medium, up to 5 files.

## Task 08: Standalone implementer planning

Description: Let implementer inspect the task and repository and form a narrow plan when analysis is absent, without changing publication authorization in this task.

Acceptance criteria:
- [ ] Supplied plans remain authoritative context; absent plans lead to recorded assumptions and actual verification rather than fabricated upstream analysis.
- [ ] Completed/blocked results accurately distinguish local changes, committed work, and successful publication; impossible tasks return a blocker.
- [ ] Foreman never advances to review or PR creation on blocked or unpublished work; trusted native behavior remains intact.

Verification: Result/publication fixtures, shared checks, and approved scratch TUI cases with and without a supplied plan.

Dependencies: 07.

Files likely touched: implementer `agent.ts`, `instructions.md`, optional `lib/result.ts`; root instructions; `tests/implementer-outcomes.test.ts`.

Estimated scope: Medium, up to 5 files.

## Task 09: Standalone review

Description: Let reviewer judge a supplied branch and task without an implementer or analyst report.

Acceptance criteria:
- [ ] Reviewer reads the real diff, distinguishes supplied from inferred criteria, and reports missing intent explicitly without editing implementation.
- [ ] Missing branch/essential context produces a blocker; request-changes remains a completed review.
- [ ] Foreman correctly unwraps results and retains the maximum two revision cycles.

Verification: Reviewer result fixtures, shared checks, and approved scratch TUI cases for approve, request-changes, and blocked review.

Dependencies: 08.

Files likely touched: reviewer `agent.ts`, `instructions.md`, optional `lib/result.ts`; root instructions; `tests/reviewer-outcomes.test.ts`.

Estimated scope: Medium, up to 5 files.

## Checkpoint C: Native role independence

- [ ] All five specialists have completed/blocked contracts; no dependent stage proceeds after a blocker.
- [ ] Standalone analyst, implementer, and reviewer cases work without earlier reports.
- [ ] Approved routing/safety evals and TUI exercise preserve native pipeline order and review limits; record any unrun live cases.

## Task 10: Shared constrained source checkout

Description: Share the existing branch checkout behavior between implementer and reviewer, adding separately constrained read-only base support only if required by the approved input contract.

Acceptance criteria:
- [ ] Thin station mounts use one tested implementation with literal remote URL and firewall-brokered credentials.
- [ ] Bounded source/base validation rejects injection and unsafe refs without weakening protected-branch write restrictions.
- [ ] Tests cover fetch failure and network-policy cleanup; existing default-base behavior is unchanged.

Verification: Fake sandbox/credential tests and shared checks; approved scratch source/base checkout smoke.

Dependencies: Checkpoint C.

Files likely touched: `agent/lib/tools/checkout-branch.ts`; both existing `tools/checkout_branch.ts` mounts; `agent/lib/github/git-remote.ts` if necessary; `tests/checkout-branch.test.ts`.

Estimated scope: Medium, up to 5 files.

## Task 11: Analyst source branch context

Description: Mount shared checkout for analyst and support optional validated source/comparison context without requiring it.

Acceptance criteria:
- [ ] Supplied source branch is inspected; absent source uses the session's default checkout.
- [ ] Invalid or inaccessible source/base produces an honest blocker, not analysis of the wrong branch.
- [ ] Analyst retains its planning-only role and existing sandbox setup.

Verification: Focused branch-selection tests, shared checks, and approved analyst TUI smoke on a scratch branch.

Dependencies: 10.

Files likely touched: analyst `tools/checkout_branch.ts`, `instructions.md`; analyst result contract if needed; `tests/analyst-branch.test.ts`.

Estimated scope: Medium, up to 4 files.

## Task 12: Unique fresh branch identity

Description: Generate fresh implementation branch names with a server-derived execution suffix through the supported session context proven earlier.

Acceptance criteria:
- [ ] Ten identical slugs in distinct executions yield ten valid distinct feature branches; caller text cannot choose the execution identity.
- [ ] Names are bounded and pass existing branch safety checks; native and external fresh runs use the same rule.
- [ ] Explicit revision branches are retained rather than renamed.

Verification: Deterministic branch identity tests and shared checks; no remote push is necessary for unit coverage.

Dependencies: 08, 10, Checkpoint A.

Files likely touched: implementer `lib/branch-name.ts`, optional branch-preparation tool, `instructions.md`; `tests/branch-name.test.ts`.

Estimated scope: Medium, up to 4 files; exact context integration follows feasibility evidence.

## Checkpoint C1: Safe branch preparation

- [ ] Source selection and fresh branch naming work with no weakening of git validation or credential boundaries.
- [ ] Existing revision names remain usable and analyst has only the capability it needs.
- [ ] Shared checks and branch tests pass.

## Task 13: Revision conflict handling

Description: Refuse conflicting remote revision updates rather than relying on sandbox isolation or overwriting remote work.

Acceptance criteria:
- [ ] Divergent concurrent revisions produce an explicit conflict/failure result and never use force push.
- [ ] A stale revision cannot silently replace another task's remote changes; any required compare/serialization strategy is documented and tested.
- [ ] Implementer reports unpublished/conflicted work accurately and Foreman does not deliver it as successful.

Verification: Fake remote tests for fast-forward, stale, divergent, and failed updates; shared checks. Deliberate scratch race test before live acceptance.

Dependencies: 12.

Files likely touched: implementer `tools/push_branch.ts`, `lib/revision.ts` if needed, `instructions.md`; shared checkout helper if required; `tests/revision-conflicts.test.ts`.

Estimated scope: Medium, up to 5 files.

## Task 14: Standalone execution budgets

Description: Apply explicit bounded task execution using the supported runtime mechanism, without changing model vendor assignments.

Acceptance criteria:
- [ ] Every public target, including Foreman, has an explicit budget independent of a native parent's budget.
- [ ] Exhaustion produces a retrievable terminal runtime outcome rather than indefinite execution or false success.
- [ ] Existing native parent limits are not loosened; implementer and reviewer remain on different vendors.

Verification: Fake budget-exhaustion tests and shared checks; validate the actual runtime setting through the approved proof. Split by agent if the API requires editing more than five files.

Dependencies: Checkpoint A, 04.

Files likely touched: execution adapter selected at feasibility; `tests/a2a-budgets.test.ts`; feasibility note. Agent definitions only if required, in separate slices.

Estimated scope: Small to medium, 2-3 files with runtime-level support.

## Task 15: Approve anonymous capability and data policy

Description: Obtain a concrete policy before connecting public dispatch to real integrations. Do not infer that untrusted means existing anonymous behavior is safe.

Acceptance criteria:
- [ ] Human approves a per-capability matrix covering repository reads/writes, issue/PR actions, sandbox execution, artifacts, brain, preferences, Linear, and native descendants of public Foreman.
- [ ] Explicitly decide read exposure, task lookup/cancel exposure, public Blob limitations, sensitive-data prohibition, and acceptable cost/admission posture without adding authentication implicitly.
- [ ] Record which actions must deny rather than park and which scratch/live resources are authorized; production remains blocked if any decision is unresolved.

Verification: Compare matrix against all discovered tools/connections and spec section 8; run `pnpm check` on documentation. Capture human approval, not merely a recommendation.

Dependencies: Checkpoint A; can be researched alongside role work.

Files likely touched: `docs/specs/independent-a2a-agents-access.md`; spec gate status.

Estimated scope: Small, 1-2 documentation files.

## Task 16: Repository policy enforcement

Description: Implement the approved public caller classification and repository-write rules for direct and delegated executions.

Acceptance criteria:
- [ ] Only server-derived context marks public calls; caller metadata cannot forge trust or escape the public policy through Foreman delegation.
- [ ] Push, close/reopen, draft/non-draft PR, labels, comments, and all mounted repository writes obey the approved matrix and deny disallowed one-shot actions without parking.
- [ ] Existing GitHub/Linear authenticated intake and autonomous issue scoping retain their behavior.

Verification: Table-driven public/trusted/autonomous tests including delegated children, forged stamps, and all GitHub write policies; shared checks.

Dependencies: 15, 13, 14.

Files likely touched: `agent/lib/trust.ts`; `agent/lib/github/approval.ts`; implementer `tools/push_branch.ts`; execution adapter; `tests/public-repository-policy.test.ts`.

Estimated scope: Medium, up to 5 files; split additional extension wiring into its own slice if needed.

## Task 17: Storage and Linear enforcement

Description: Complete the approved public policy for non-repository capabilities without creating a shared writable anonymous user identity.

Acceptance criteria:
- [ ] Public preference, shared-brain, artifact, and Linear behavior matches the approved matrix; forbidden one-shot operations deny instead of awaiting approval.
- [ ] Preference keys still derive only from resolved identity; artifact containment, bounds, uniqueness, and non-overwrite behavior remain intact.
- [ ] Tests cover direct and descendant calls plus authenticated regressions and the approved read-exposure limits.

Verification: Focused storage/connection policy tests and shared checks; compare coverage against the complete capability matrix.

Dependencies: 16.

Files likely touched: `agent/lib/user-preferences.ts`; `agent/lib/github/approval.ts`; `agent/connections/linear.ts`; `agent/lib/artifacts/tools.ts`; `tests/public-storage-policy.test.ts`.

Estimated scope: Medium, up to 5 files. If the approved matrix requires individual preference-tool gates or new read gates, split those enforcement mounts into additional small tasks before proceeding.

## Checkpoint D: No exposure by omission

- [ ] Every reachable capability is covered by the approved matrix and tests, including delegated Foreman work.
- [ ] No public task can strand on approval or reach sensitive production data through an omitted policy.
- [ ] Human confirms scratch transport integration may proceed; this is not production deployment approval.

## Task 18: Classifier A2A submission and polling

Description: Implement the first complete protocol path using the proven execution adapter and durable identity mapping. Start with classifier and publish only implemented capabilities.

Acceptance criteria:
- [ ] Pinned official SDK client reads classifier's card and submits bounded text/structured context to a fresh canonical classifier task; initial version supports async submission and polling only.
- [ ] Agent/task-bound retrieval survives a new adapter instance and maps completed, blocked, and runtime failure correctly; duplicate-message behavior matches the proven contract.
- [ ] Unknown targets, invalid inputs, unsupported parts/methods, arbitrary attachments/callbacks, and identity overrides fail before model work; route access uses approved server-derived public context.

Verification: Official SDK client tests against fake execution plus durable-store integration tests; shared checks. No production enablement. SDK dependency pin is a separate mechanical sub-slice if it would exceed the file cap.

Dependencies: Checkpoints A and D; 05, 14; approved SDK/protocol pin.

Files likely touched: `agent/channels/a2a.ts`; `agent/lib/a2a/protocol.ts`; proven execution adapter; durable mapping module if required; `tests/a2a-classifier.test.ts`.

Estimated scope: Medium, up to 5 implementation/test files; reuse feasibility code rather than create duplicate runtime layers.

## Task 19: A2A cancellation

Description: Add protocol cancellation for the classifier path using eve's confirmed cancellation semantics.

Acceptance criteria:
- [ ] Cancellation addresses only the specified agent/task and does not create work for unknown IDs.
- [ ] Completion/cancellation races and repeated cancellation produce one consistent durable terminal result; a request to cancel is not reported as confirmed cancellation prematurely.
- [ ] Card capability claims match the implemented official SDK contract.

Verification: SDK cancel/get tests with delayed execution, late completion, repeated cancel, and a fresh server instance; shared checks.

Dependencies: 18.

Files likely touched: A2A channel, protocol module, execution adapter, mapping module if needed; `tests/a2a-cancellation.test.ts`.

Estimated scope: Medium, up to 5 files.

## Checkpoint E: One working protocol lifecycle

- [ ] Classifier card, submit, poll, and cancel work with the pinned official SDK client.
- [ ] Restart/retry/race behavior is verified against durable state, not only an in-memory fake.
- [ ] Review before expanding the allowlist; no unsupported capabilities are advertised.

## Task 20: Remaining canonical endpoints

Description: Extend the tested path to researcher, analyst, implementer, reviewer, and Foreman with a small allowlist, not a second agent registry.

Acceptance criteria:
- [ ] All six proposed card and JSON-RPC paths resolve to the correct canonical definition; specialist URLs never invoke Foreman's model.
- [ ] Each role uses its validated completed/blocked contract and standalone budget; Foreman's one-shot response and approval-denied behavior map correctly without breaking existing channels.
- [ ] Cards describe actual roles, accepted context, protocol version, and implemented capabilities; unknown names remain rejected.

Verification: Parameterized SDK path/contract tests for all six targets, shared checks, and approved direct/native equivalence smoke.

Dependencies: Checkpoint E; Checkpoint C; 11-14.

Files likely touched: A2A channel, protocol/allowlist module, execution adapter; root instructions if needed for tasks without an intake thread; `tests/a2a-agents.test.ts`.

Estimated scope: Medium, up to 5 files. Split any new Foreman result contract into a separate reviewed slice if required by the proof.

## Task 21: Isolation and adversarial coverage

Description: Exercise the acceptance target and failure paths before live concurrency testing.

Acceptance criteria:
- [ ] Ten concurrent same-agent tasks have distinct sessions, conversations, writable checkouts where applicable, branches, and results; cancelling one affects none of the others.
- [ ] Cross-agent IDs, reused context IDs, oversized content, malformed refs, forged identity metadata, and unsupported operations cannot redirect work or bypass policy.
- [ ] Fault tests cover restart retrieval, interrupted dispatch, duplicate submission, terminal races, and artifact uniqueness without claiming tenant confidentiality or exactly-once execution beyond the evidence.

Verification: Offline concurrency/adversarial tests and actual durable-store fault tests plus shared checks. Verify every spec section 9 criterion has either a deterministic test or a pending live test in Task 22.

Dependencies: 20.

Files likely touched: `tests/a2a-concurrency.test.ts`; `tests/a2a-adversarial.test.ts`; `tests/a2a-durability.test.ts`; shared test fixtures if necessary.

Estimated scope: Medium, up to 4 files. Fix discovered behavior in separate focused slices, not inside a large test-only commit.

## Checkpoint F: Offline acceptance

- [ ] All six target paths, policy tests, protocol tests, and concurrency tests pass.
- [ ] `pnpm validate` and `pnpm build` succeed on the final code state.
- [ ] Human approves the exact scratch environment, budgets, and real-resource test scope for Task 22.

## Task 22: Controlled live acceptance and operation docs

Description: Verify the deployed behavior deliberately on disposable public resources and document use, failure handling, and exposure limits.

Acceptance criteria:
- [ ] Demonstrate ten real concurrent same-agent sandboxed tasks, isolated cancellation, restart-safe retrieval, and same-branch conflict rejection; link sanitized evidence to spec acceptance criteria.
- [ ] Exercise `pnpm dev`, approved `pnpm eval --tag fast`, and deliberately authorized `pnpm eval pipeline/full-pipeline`; confirm existing authenticated intake and native delegation remain intact.
- [ ] Document all six card/endpoint URLs, client examples for the pinned SDK, budgets, duplicate semantics, blockers, unsupported features, policy limits, and rollback by disabling only the new routes.

Verification: Record exact approved scratch deployment/SDK/sandbox commands, final focused/full test results, `pnpm validate`, and `pnpm build`. Do not mark skipped or blocked live tests complete. Clean up scratch resources only within approved scope.

Dependencies: Checkpoint F and explicit approval for live tests.

Files likely touched: `docs/a2a.md`; `.github/ARCHITECTURE.md`; feasibility/acceptance evidence note; `tasks/todo.md`.

Estimated scope: Medium, up to 4 documentation files; split live execution into separate sessions if budget or runtime requires it.

## Checkpoint G: Final review and production gate

- [ ] Every spec acceptance criterion has linked evidence; no unsupported test pass is claimed.
- [ ] Human reviews capability/data/cost decisions and separately authorizes any production exposure; unresolved decisions keep it disabled.
- [ ] Every implementation slice is verified and committed, no secrets/generated output are staged, and no incomplete application changes remain.

## Planning-change verification record

Task completeness reviewed: each task records acceptance criteria, verification, dependencies, likely files, and scope; feasibility and exposure gates remain explicit. No existing plan was overwritten. `git diff --check` reported no tracked-diff whitespace errors (the new task files were still untracked). `pnpm validate` could not start because `pnpm` is unavailable in this shell; `mise exec -- pnpm validate` also failed to locate it. Validation is blocked, not passed. No application code, dependencies, route permissions, or deployment configuration were changed by creation of this checklist. No build, TUI, model eval, deployment, or live feasibility test was run; no commit was created.
