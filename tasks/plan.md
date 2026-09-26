# Implementation Plan: Independent agents with A2A access

## Status and scope

Planning only. The user requested a task breakdown; this does not mark the [draft spec](../docs/specs/independent-a2a-agents.md) approved, prove framework feasibility, or authorize deployment. The [confirmed intent](../docs/intent/independent-a2a-agents.md) remains the outcome: six independently callable agents in one service, with one canonical implementation per agent and native internal delegation.

The executable checklist is [todo.md](./todo.md). All implementation tasks are pending human review. Tasks after the feasibility checkpoint are conditional estimates, not permission to work around a failed gate.

## Repository findings

- No existing `tasks/plan.md` or `tasks/todo.md` was present when this plan was created; the working tree was clean.
- Installed eve is `0.39.3`; `package.json` requests `^0.39.3`. Public `ChannelSendOptions` supports mode and output schema but has no target-agent selector. Custom channels are root-only. Direct canonical specialist dispatch remains unproven.
- Canonical specialists live under `agent/subagents/{classifier,researcher,analyst,implementer,reviewer}/`. Keep their definitions, instructions, tools, and sandbox ownership there.
- Implementer requires upstream analysis today, always attempts publication, and names fresh branches without an execution suffix. Its existing schema already reports `pushed`; preserve accurate publication reporting when adding blocked outcomes.
- Reviewer and implementer own checkout tools; analyst has no checkout tool. A shared checkout implementation is warranted if analyst gains validated branch selection, not as a general tool-directory cleanup.
- Foreman's prompt consumes existing result shapes, retries malformed/failed stations, and caps revisions at two. Every result migration must update its consumer in the same slice.
- `agent/lib/trust.ts` is the trust authority. Existing public write, approval, preference, and read-exposure concerns in spec section 8 are unresolved.
- Scripts provide `pnpm validate`, `pnpm build`, `pnpm dev`, and token-consuming evals, but no deterministic `test` command. Establish a small offline test harness before implementing behavior.
- The skills' `../../references/definition-of-done.md` target is absent. Use `AGENTS.md` verification and the spec acceptance criteria as the standing completion bar; do not fabricate a missing project policy.

## Architecture decisions to preserve

1. One root transport channel, proposed `agent/channels/a2a.ts`, selects only an allowlisted canonical agent. No Foreman model hop for specialist URLs, copied definitions, internal HTTP delegation, deep framework imports, or independent model loop.
2. Keep protocol validation and mapping under `agent/lib/a2a/`; keep role contracts under each specialist. Introduce only helpers needed by an implemented slice. Shared tools are explicit thin mounts over `agent/lib/tools/`, not automatically discovered root tools.
3. eve owns execution and durable lifecycle. Select any additional task mapping store only after proving the supported entry point. In-memory execution doubles are for tests, never production durability.
4. Proposed public contract is A2A 1.0 JSON-RPC, async submission and polling with cancellation. Verify and pin the SDK/protocol pair before committing to wire names. Streaming, callbacks, uploads, and continued conversations stay out of scope.
5. Each task receives a server-assigned identity and fresh execution session. A caller's context ID cannot choose a writable session. Task lookup and cancellation use both agent and task IDs.
6. Model-declared `completed` and `blocked` are role outcomes; runtime failures are distinct. A requested review revision is a completed review. Foreman must stop dependent stages on blockers.
7. All role changes retain current model assignments, literal remote URLs, brokered credentials, protected-branch validation, bounded artifacts, and existing authenticated intake.
8. No anonymous production route may reach real resources before explicit capability and data-exposure approval. Fake execution and disposable public resources are the development path, not a silently selected production permission profile.

## Gates and dependency graph

```text
Human review of spec and plan
  -> 01 supported entry-point audit
  -> 02 local canonical-specialist proof
  -> 03 deployed durability/cancellation proof
  -> CHECKPOINT A: feasibility accepted or STOP
       -> 04 offline tests
       -> 05 classifier outcome + Foreman handling
            -> 06 researcher independence
            -> 07 analyst independence
            -> 08 implementer independence
            -> 09 reviewer independence
       -> 10 safe shared source checkout -> 11 analyst source branch
       -> 12 unique fresh branches -> 13 revision conflict handling
       -> 14 standalone budgets
       -> 15 anonymous capability/data decision
            -> 16 repository write enforcement
            -> 17 shared storage/Linear enforcement
       -> CHECKPOINT D: policy coverage accepted
       -> 18 classifier A2A submit/get slice (requires outcomes, budgets, safety)
       -> 19 A2A cancellation slice
       -> 20 remaining agent endpoints
       -> 21 adversarial/concurrency/durability tests
       -> 22 controlled acceptance and docs
       -> explicit production deployment decision
```

Checkpoints and precise dependencies are recorded in `todo.md`. Later implementation details, including file names for the execution adapter and durable store, must be updated from the feasibility evidence rather than guessed now.

## Task list

### Phase 1: Fail fast on framework feasibility

- [ ] 01: Audit supported specialist dispatch and pin candidate protocol versions.
- [ ] 02: Prove one canonical sandboxed specialist runs directly locally.
- [ ] 03: Prove deployed durable retrieval and cancellation.
- [ ] Checkpoint A: Approve evidence or stop for a framework/design decision.

### Phase 2: Independent roles in the existing pipeline

- [ ] 04: Establish deterministic offline tests.
- [ ] 05: Migrate classifier outcomes with Foreman handling.
- [ ] 06: Migrate researcher outcomes.
- [ ] Checkpoint B: Role result pattern works without breaking delegation.
- [ ] 07: Make analyst independent of classifier reports.
- [ ] 08: Make implementer independent of analyst reports.
- [ ] 09: Make reviewer independent of implementer reports.
- [ ] Checkpoint C: Native pipeline handles standalone results and blockers.
- [ ] 10: Share constrained source checkout.
- [ ] 11: Let analyst inspect a supplied source branch.
- [ ] 12: Allocate unique fresh implementation branches.
- [ ] Checkpoint C1: Branch preparation preserves git safety.
- [ ] 13: Reject conflicting revisions without force pushes.
- [ ] 14: Bound standalone execution budgets.

### Phase 3: Resolve and enforce anonymous access policy

- [ ] 15: Obtain capability and data-exposure approval.
- [ ] 16: Enforce repository write policy for public calls and descendants.
- [ ] 17: Enforce shared storage and Linear policy.
- [ ] Checkpoint D: Verify approved policy covers every reachable capability.

### Phase 4: Add protocol paths incrementally

- [ ] 18: Deliver classifier submission and durable polling.
- [ ] 19: Deliver cancellation and race-safe terminal mapping.
- [ ] Checkpoint E: One complete SDK-compatible task lifecycle works.
- [ ] 20: Expose all remaining canonical agents.
- [ ] 21: Prove isolation and reject adversarial requests.
- [ ] Checkpoint F: All six paths pass offline acceptance.
- [ ] 22: Run controlled acceptance and document operation.
- [ ] Checkpoint G: Human review before production exposure.

## Verification discipline

Each code slice begins with a failing focused test where behavior can be tested deterministically, then implementation and verification. Task 04 establishes `pnpm test` and an explicit focused-file command; until then, proof tasks record their own exact repeatable commands. Do not pretend evals are an offline unit-test suite.

For each code slice, run focused tests, `pnpm test`, `pnpm validate` (zero lint/type/discovery errors and warnings), and `pnpm build`. Inspect LSP diagnostics for edited TypeScript. Exercise `pnpm dev` for changes affecting native agent behavior. Run each command once on a given code state; repeat only after relevant changes. Save a focused commit after successful verification without staging secrets or generated output. A missing environment value or service blocks that verification; record it rather than implying a pass.

Real model evals, deployments, sandboxes, and branch pushes require deliberate approval and a disposable public repository. `pnpm eval --tag fast` is not free. `pnpm eval pipeline/full-pipeline` pushes a real branch. Record reproducible evidence, not credentials, private source, or raw sensitive task content.

For this planning-only change, run `pnpm validate` and review task completeness. Build, TUI, and model-backed proof remain future work; no execution evidence is claimed by the plan.

## Parallelization

- After Checkpoint A, capability-policy deliberation and read-only integration research can proceed alongside role work.
- Outcome migrations are sequential because they share `agent/instructions.ts`. Checkout tasks are sequential because they share git helpers. Test harness and contract conventions must land before parallel test writing.
- After the contracts settle, protocol fixtures and capability-matrix tests can be authored in parallel with separate file ownership. Merge shared trust changes in order.
- Do not parallelize production exposure with unfinished policy coverage. A successful protocol test is not authorization to deploy.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Installed eve cannot dispatch a complete local specialist directly | Blocks architecture | Tasks 01-03 first; request explicit approval for an upgrade or upstream addition, never bypass with internals |
| Local proof works but deployed durable execution does not | Lost or misrouted tasks | Require deployed restart/retrieval/cancel evidence before adapter work |
| Additional mapping store introduces a dispatch crash window | Duplicate or orphaned work | Prove identity allocation, retry semantics, and crash recovery; do not advertise exactly once |
| Anonymous calls inherit credentials or approvals | Writes, data leakage, stuck tasks | Capability inventory, server-derived caller class, descendant tests, explicit exposure decision |
| Branch names collide or revisions overwrite | Cross-task interference | Server execution suffix; non-force conflict rejection and remote-state checks |
| Schema migrations break Foreman | Incorrect downstream work or draft PR | Consumer update and blocked/completed regression fixtures in every role slice |
| Scope expands into a framework or repository reorganization | Delayed delivery and maintenance burden | Keep role folders canonical; cap slices around five files and split when evidence requires more |
| Public traffic consumes unbounded resources | Cost abuse | Explicit per-task budgets; approve admission/cost posture before deployment |
| Public task IDs and Blob URLs mistaken for confidentiality | Sensitive data disclosure | Use disposable public data; document no tenant confidentiality and block sensitive production use |

## Open decisions

- Is the draft spec approved for feasibility implementation? Planning alone does not answer this.
- Which supported eve API/version can execute compiled specialists directly? Is a framework change acceptable if none exists?
- Which exact SDK/protocol versions interoperate with the deployed route? Which durable mapping strategy passes the crash-boundary proof?
- What capabilities may anonymous callers and their delegated children use? What read exposure and cost-abuse posture are acceptable?
- Which scratch environment, public repository, and model/sandbox budget are approved for live acceptance?

## Completion bar

All spec section 9 criteria must have evidence linked from `todo.md`; skipped live tests remain unchecked. All slices must be independently verified and reviewable, existing authenticated intake must remain intact, and production access must remain closed until its separate approval. A blocked feasibility gate is a valid stopping point, not a reason to implement a different architecture silently.
