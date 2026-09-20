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
- Current level: advanced
- Updated: 2026-09-18
- Next focus: Complete the delayed transfer check, then study multi-row invariants.

## Roadmap

- [x] Read-modify-write races
- [ ] Atomic increments
- [ ] Multi-row invariants

## Evidence

| Date | Concept / scenario | Learner response and reasoning | Outcome / assistance | Completion or review decision |
| --- | --- | --- | --- | --- |
| 2026-09-17 | Atomic increments: increasing an inventory quantity | Explained that an atomic increment applies to current state rather than writing an old computed replacement. | Correct / unassisted | First application only. |
| 2026-09-18 | Separate concept: transaction boundaries | Correctly identified which changes must commit together. | Correct / unassisted | Intervening concept reviewed; atomic-increment transfer check is still pending. |

## Weak areas and review

None recorded.

## Checkpoint

- Status: awaiting-answer
- Concept: Atomic increments
- Difficulty: advanced
- Assistance: none

**Question:** Two workers each add 3 to a counter initially 20 using committed atomic UPDATE counters SET value = value + 3 WHERE id = 1 operations in a database that serializes updates to this row. Which result and explanation are correct?

1. 23, because both workers replace 20 with 23.
2. 26, because each serialized update adds 3 to the then-current row value.
3. Explain this case.

Reply with 1, 2, or 3; if you choose 1 or 2, briefly explain your reasoning.

## Cheat sheet

- Separate reading from replacing a stored value.
- State the invariant that concurrent operations must preserve.
- Related changes sometimes need a shared transaction boundary.

## Resources

No verified resources added yet.
<!-- mastery-path:end -->

## Personal follow-up

- [x] Booked Thursday study time.
