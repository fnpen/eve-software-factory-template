---
tags: [learning, backend]
custom_property: preserve-me
---

# My concurrency notes

[[#Personal notes]]

## Personal notes

Keep my deployment checklist untouched.
- [ ] Ask Maya about the staging incident.

<!-- mastery-path:start -->
## Training state

- Topic: Database concurrency
- Goal: Diagnose and prevent production concurrency bugs.
- Current level: senior-level
- Updated: 2026-09-18
- Next focus: Resolve the pending read-your-writes scenario, then compare cross-region costs.

## Roadmap

- [x] Transactions and invariants
- [x] Replica lag
- [ ] Read-your-writes routing
- [ ] Cross-region trade-offs

## Evidence

| Date | Concept / scenario | Learner response and reasoning | Outcome / assistance | Completion or review decision |
| --- | --- | --- | --- | --- |
| 2026-09-17 | Transactions and invariants; bank-transfer and inventory cases separated by another concept | Correct answers with invariant explanations. | Correct / unassisted | Transactions and invariants completed. |
| 2026-09-18 | Replica lag; two transfer cases separated by transaction review | Distinguished asynchronous propagation from lost data. | Correct / unassisted | Replica lag completed. |

## Weak areas and review

None recorded.

## Checkpoint

- Status: awaiting-answer
- Concept: Read-your-writes routing
- Difficulty: senior-level
- Assistance: none

**Question:** After a successful primary write, a customer must immediately see that update. Replicas can lag unpredictably. Which read policy meets this requirement without assuming a fixed lag bound?

1. Always read any replica after sleeping for 100 ms.
2. Use the primary or a replica confirmed to have replayed the write.
3. Explain this case.

Reply with 1, 2, or 3; if you choose 1 or 2, briefly explain your reasoning.

## Cheat sheet

- Transactions group changes under defined guarantees.
- Invariants describe states the application must preserve.
- Replica lag is delayed propagation, not necessarily lost data.

## Resources

No verified resources added yet.
<!-- mastery-path:end -->

## Personal follow-up

- [x] Booked Thursday study time.
