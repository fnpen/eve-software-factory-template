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
- Current level: beginner
- Updated: 2026-09-18
- Next focus: Understand lost updates before learning atomic increments.

## Roadmap

- [x] Reads and writes
- [ ] Lost updates
- [ ] Atomic increments

## Evidence

| Date | Concept / scenario | Learner response and reasoning | Outcome / assistance | Completion or review decision |
| --- | --- | --- | --- | --- |
| 2026-09-17 | Reads versus writes, two distinct examples separated by transaction basics | Correctly distinguished observations from changes. | Correct / unassisted | Reads and writes completed. |

## Weak areas and review

None recorded.

## Checkpoint

- Status: awaiting-answer
- Concept: Lost updates
- Difficulty: beginner
- Assistance: none

**Question:** Two requests both read a counter of 10, each computes 11, and then each writes 11. Why is the final value not 12?

1. Both writes replace the value with 11, so one increment is lost.
2. The database always rejects the second concurrent write.
3. Explain this case.

## Cheat sheet

- A read observes stored state.
- A write changes stored state.
- Operations from different requests can overlap.

## Resources

No verified resources added yet.
<!-- mastery-path:end -->

## Personal follow-up

- [x] Booked Thursday study time.
