# Eve Software Factory — Mastery Path

<!-- mastery-path:start -->
## Training state

- Topic: Operating and extending the eve Software Factory (Foreman).
- Goal: Understand the deployed factory's capabilities, run work from GitHub issues, understand its specialist agents, and request development of a similar solution.
- Current level: beginner; one correct unassisted orchestration application.
- Updated: 2026-09-20
- Context: Learner reports deploying the linked template on Vercel. Local source and the official guide were inspected; deployed configuration and runtime have not been inspected.
- Next focus: Writing actionable feature requests after GitHub intake practice; then revisit orchestration with a separated transfer case.

## Roadmap

### Beginner
- [ ] Foreman versus specialist stations; optional researcher; draft PR outcome.
- [ ] GitHub label and mention intake, bot identity, and caller permissions.
- [ ] Writing actionable feature requests and acceptance criteria, including a similar-factory request.

### Intermediate
- [ ] Following progress, clarification, review revisions, and draft PR handoff.
- [ ] Capability map: triage, PR summaries, CI repairs, Linear, and local TUI.
- [ ] Preferences, shared factory brain, and handoff artifacts.

### Advanced
- [ ] Diagnose missing triggers, stalled approvals, and bounded CI repair failures.
- [ ] Trust boundaries, sandbox credentials, and human shipping decisions.

### Senior-level
- [ ] Scope a similar factory and choose extensions, models, approval policies, and verification under explicit constraints.

Completion requires two correct unassisted applications in different scenarios, including transfer, separated by another concept or a later session. Advanced and senior-level evidence also requires sound reasoning. Quiz evidence does not certify workplace seniority or unobserved implementation skills.

## Evidence

| Date | Concept / scenario | Learner response and reasoning | Outcome / assistance | Completion or review decision |
| --- | --- | --- | --- | --- |
| 2026-09-20 | Orchestration / small CSV export needing planning and independent review | Chose 2; no rationale requested at beginner level | Correct, unassisted | One observation; incomplete pending a separated transfer application |

## Weak areas and review

No assessed gaps yet. Deployed environment values, connector setup, and runtime health remain unverified, not learner misconceptions.

## Checkpoint

- Status: awaiting-answer
- Concept: Choosing unattended GitHub label intake.
- Difficulty: beginner
- Assistance: none; introductory review only.

**Question:** Your GitHub connector is working, the intake label is the default `factory`, and you have repository triage permission. A bug issue contains clear reproduction steps and acceptance criteria. You want to hand it off without an interactive conversation. What should you do?

1. Apply the `factory` label to the issue to trigger unattended intake.
2. Post a comment saying `@implementer fix this`, treating the station name as a separate GitHub bot.
3. Explain this case.

## Cheat sheet

- Give Foreman the desired outcome; it coordinates the specialist stations.
- Small coding tasks still go through planning and independent review.
- A successful pipeline delivers a draft PR, not an automatic merge.

## Resources

- https://vercel.com/kb/guide/eve-software-factory — verified 2026-09-20; official overview of stations, intake, capabilities, security, customization, and troubleshooting.
- Local agent/instructions.ts:17,39-70 — verified 2026-09-20; orchestration, station order, optional research, bounded revisions, and draft PR delivery.
- Local agent/subagents/*/agent.ts — directory inspection confirms classifier, analyst, implementer, reviewer, and researcher are declared.
- Context7 /vercel/eve documentation lookup verified the filesystem-defined subagent model on 2026-09-20.
- Local agent/channels/github.ts:21,56,69-88,222-253 — verified 2026-09-20; trusted mention dispatch and permission-checked label intake.
<!-- mastery-path:end -->
