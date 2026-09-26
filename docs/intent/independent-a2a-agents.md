# Independent agents with A2A access

Status: confirmed by the user. Technical design requires separate approval.

## Outcome

Foreman and every specialist are accessible through separate public A2A URL paths in one deployed service. Each agent has one implementation shared by internal delegation and external access.

## Users and purpose

The service is for the owner, external orchestrators, and public callers. Specialists can be used independently without running the full Foreman pipeline. Authentication is intentionally omitted at this stage.

## Invocation

Foreman uses A2A internally if that fits cleanly; otherwise it keeps native delegation. A shared implementation and simple architecture matter more than using the same transport internally and externally. Separate internal and external versions of an agent are not wanted.

## Independent behavior

Each specialist accepts a task, reads available branch context where relevant, handles its own preparation, and performs its specialist work without requiring earlier pipeline stages. For example, the implementer can inspect the repository and form its own plan when no analyst report is supplied. Agents retain their specialist roles rather than each becoming a full pipeline orchestrator. If an agent cannot proceed, it returns a clear explanation.

## Success

Ten calls to the same agent for ten different tasks can run concurrently with isolated execution state. Foreman can still coordinate its existing pipeline using those same specialists.

## Organization and constraints

Keep one deployment and keep the implementation simple. Agent-specific definitions, instructions, tools, and supporting code stay in that agent's subfolder. Shared tools and supporting code live in common folders. Avoid duplicated agent implementations and an unnecessary internal HTTP layer.

## Out of scope and deferred decisions

Authentication, deciding public write permissions, and turning every specialist into a complete orchestrator are outside this phase. Leaving public write permissions undecided does not authorize additional access. Public exposure risks must remain explicit in the technical spec rather than being treated as resolved by this intent.

## Next artifact

The [technical spec](../specs/independent-a2a-agents.md) records framework findings, the proposed design, acceptance criteria, and unresolved feasibility constraints. Implementation planning follows approval of that spec.
