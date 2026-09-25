# Eve Software Factory — Mastery Path

<!-- mastery-path:start -->
## Training state

- Topic: Operating and extending the eve Software Factory (Foreman).
- Goal: Understand the deployed factory's capabilities, run work from GitHub issues, understand its specialist agents, and request development of a similar solution.
- Current level: beginner; one correct unassisted orchestration application.
- Updated: 2026-09-20
- Context: Learner reports deploying the linked template on Vercel. Local source and the official guide were inspected; deployed configuration and runtime have not been inspected.
- Next focus: Reinforce label-triggered intake with a simpler case after the requested explanation; then teach actionable feature requests and later revisit orchestration.

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
| 2026-09-20 | GitHub intake / triage-authorized unattended bug handoff | Chose 3, requesting explanation | Assisted walkthrough; neither failure nor independent success | Intake remains incomplete; fresh simpler checkpoint |

## Weak areas and review

GitHub label intake needs independent practice after an explanation request; no incorrect answer or specific misconception demonstrated. Deployed environment values, connector setup, and runtime health remain unverified, not learner misconceptions.

## Checkpoint

- Status: awaiting-answer
- Concept: Choosing unattended GitHub label intake.
- Difficulty: beginner
- Assistance: fresh case follows an answer-revealing walkthrough of label intake; count immediate success as assisted practice, not independent mastery.

**Question:** You own the target repository, its connector works, and its intake label is `factory`. You create a complete issue titled “Fix the broken help-page link” but leave it unlabeled and do not mention the bot. How should you start an unattended run?

1. Wait for Foreman to scan every open issue automatically; creating the issue is enough.
2. Apply the `factory` label to hand this issue to Foreman.
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
