---
meta:
  title: Call Foreman and individual stations through A2A
  contentType: Reference
  category: Integrations
  navLabel: Calling A2A Roles
---

<!-- Content plan: Audience: developers integrating agent clients and operators deploying the server. Goal: identify role endpoints, supply valid authenticated requests, and explain execution limits. Content: routes, configuration, request examples, input contracts, execution, security, deployment limits. Open questions: production rate limits, retention, request deduplication, and retained GitHub integration compatibility need deployment-specific decisions or verification. -->

# Call Foreman and individual stations through A2A

Use the [Agent2Agent (A2A) protocol](https://a2a-protocol.org/) to call Foreman or one of five specialist agents in one Next.js deployment. This reference covers endpoints, authentication, input contracts, and operational limits. The server uses the [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) and [Vercel Workflow](https://useworkflow.dev/) rather than an eve root session.

Both call paths reuse station instructions and contracts from `agents/<role>/`, plus centralized model assignments from `agent/lib/models.ts`. Role metadata, input validation, reasoning, tool allowlists and sandbox modes live in each agent's `definition.ts`; `agents/registry.ts` composes the catalog. See the [agent structure and extension guide](../agents/README.md). They also share [handoff artifacts and factory memory](https://ask-foreman.dev/docs/memory). A station is a specialist agent that performs one pipeline task.

The original eve application remains available through its existing scripts, but the two entry points don’t have feature parity. GitHub and Linear intake, preferences, triage comments, and interactive approvals remain in eve. Deploying the A2A app doesn’t start eve.

## Role endpoints and supported operations

Each role has a JSON-based remote procedure call (JSON-RPC) endpoint and a public Agent Card describing its capabilities:

| Role | JSON-RPC endpoint | Agent Card |
| --- | --- | --- |
| Foreman | `/a2a/foreman` | `/a2a/foreman/.well-known/agent-card.json` |
| Classifier | `/a2a/classifier` | `/a2a/classifier/.well-known/agent-card.json` |
| Researcher | `/a2a/researcher` | `/a2a/researcher/.well-known/agent-card.json` |
| Analyst | `/a2a/analyst` | `/a2a/analyst/.well-known/agent-card.json` |
| Implementer | `/a2a/implementer` | `/a2a/implementer/.well-known/agent-card.json` |
| Reviewer | `/a2a/reviewer` | `/a2a/reviewer/.well-known/agent-card.json` |

`/.well-known/agent-card.json` returns the Foreman card. Supply the specialist’s card URL when discovering that role. Cards contain no credentials; execution requires authentication, including in local development.

The transport uses A2A 1.0 JSON-RPC through `@a2a-js/sdk`, not eve’s remote-agent protocol or A2A 0.3. Send the `A2A-Version: 1.0` header with every execution request. The server supports these operations:

- `SendMessage` with `configuration.returnImmediately: true`
- `GetTask`
- `CancelTask`

The server rejects these operations and options:

- Streaming and push notifications
- Task listing and follow-up messages
- Client-selected tenants
- Blocking sends

## Runtime commands and prerequisites

Use Node.js 24 and install dependencies with `pnpm install` before running the A2A scripts. Choose the command for your task:

| Task | Command |
| --- | --- |
| Start the development server | `pnpm a2a:dev` |
| Run protocol and pipeline tests | `pnpm test:a2a` |
| Check TypeScript types | `pnpm typecheck` |
| Build the production server | `pnpm a2a:build` |
| Start the production build | `pnpm a2a:start` |

Keep the [existing runtime configuration](../README.md#deploy) for `FACTORY_REPO`, LiteLLM, Vercel Connect, and Vercel Blob. Shared constants also require `LINEAR_CONNECTOR`, although this entry point doesn’t call Linear. [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) and [Vercel Blob](https://vercel.com/docs/vercel-blob) require valid Vercel credentials. Repository code runs in Sandbox, never on the app host.

## Authentication configuration

Configure a task-signing key and choose how to verify callers. A principal is the identity returned by the authenticator; only configured principals can invoke write roles.

The server uses JSON Web Tokens (JWTs) for authentication and hash-based message authentication codes (HMACs) to sign task identifiers. These additional environment variables control authentication:

| Variable | Meaning |
| --- | --- |
| `A2A_TASK_SECRET` | Server-side HMAC key with at least 32 cryptographically random characters. Use the same value across replicas and deployments that need to read existing tasks. |
| `A2A_JWT_SECRET` | Optional secret for HS256, the HMAC-SHA-256 signing algorithm. Setting it replaces Vercel OpenID Connect (OIDC) authentication for A2A routes. Keep it server-side; give clients short-lived signed tokens, never the secret. |
| `A2A_JWT_ISSUER` | JWT issuer. Defaults to `factory-clients`. Tokens require audience `factory-a2a` and a subject. Include a short expiration. |
| `A2A_TRUSTED_PRINCIPALS` | Comma-separated verified principal identifiers allowed to invoke `foreman` and `implementer`. An empty value denies both write roles. For HS256 tokens, each identifier is the verified subject. |

Without `A2A_JWT_SECRET`, eve’s `vercelOidc()` verifier authenticates Vercel callers. External clients need a server-issued token with the configured issuer and audience, or a replacement verified authenticator in `server/auth.ts`. Only the principal allowlist grants trusted status; JWT claims and message metadata can’t grant it.

## Request and polling examples

Send one data part containing the role’s input object. In this example, `FACTORY_URL` is your server URL and `A2A_TOKEN` is your short-lived client token:

```bash
curl "$FACTORY_URL/a2a/classifier" \
  -H "Authorization: Bearer $A2A_TOKEN" \
  -H 'A2A-Version: 1.0' \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": "classify-1",
    "method": "SendMessage",
    "params": {
      "message": {
        "messageId": "client-message-1",
        "role": "ROLE_USER",
        "parts": [{"data": {"workItem": "Fix duplicate password-reset emails"}}]
      },
      "configuration": {"returnImmediately": true}
    }
  }'
```

The response contains a task with a server-generated signed identifier. Replace `returned_task_id` below with that identifier. Send this body to the same endpoint with the same headers and authenticated principal:

```json
{
  "jsonrpc": "2.0",
  "id": "poll-1",
  "method": "GetTask",
  "params": {"id": "returned_task_id"}
}
```

A completed task contains a JSON data artifact. To cancel, use `CancelTask` with the same `params.id`. Cancellation stops future workflow progress but doesn’t undo completed pushes or interrupt a running shell command. Check GitHub before retrying canceled or failed write tasks.

## Role input contracts

All roles accept one data part with a `workItem` string containing the full work item. Don’t supply only an issue URL: this entry point doesn’t fetch tracker context for you. Required and optional context varies by role:

| Role | Required context | Optional context |
| --- | --- | --- |
| `classifier`, `researcher`, `analyst` | `workItem` | `classification`, `research`, and other fields in `agents/task-input.ts` |
| `implementer` | `workItem`, `classification`, `analysis` with a nonempty `acceptance_criteria` array | For revisions: `branch`, `implementation`, `findings` |
| `reviewer` | `workItem`, `analysis` with acceptance criteria, `implementation`, `branch`, `base` | Other fields in `agents/task-input.ts` |
| `foreman` | `workItem` | `researchQuestion` to request research before analysis |

Analysis and research objects can include artifact identifiers. Roles with artifact readers use the existing tools to read those documents. Every role receives the repository’s factory memory, but none can write it through A2A.

## Pipeline execution and limits

Foreman runs a fixed sequence from `agents/foreman/pipeline.ts` rather than an orchestrator model session. The pipeline accepts station execution and draft delivery functions from the durable runtime:

1. Classify the work item; stop if it needs clarification or isn’t actionable
2. Research the question if `researchQuestion` exists
3. Analyze the work item and define acceptance criteria
4. Implement the plan and push a feature branch
5. Review the branch independently, allowing at most two revision cycles
6. Create a draft pull request (PR) only after approval; otherwise stop

Direct role calls skip Foreman. A direct implementer call pushes a feature branch but doesn’t create a PR or establish review approval.

Each model call and tool call runs as a separate durable Workflow step. Workflow queues the task before the server responds and validates final station output against existing JSON schemas. The reviewer uses a different model vendor from the implementer.

The runtime enforces these limits:

| Limit | Value |
| --- | --- |
| Request body | 128 KB (128,000 bytes) |
| `workItem` length | 40,000 characters |
| Model loop | 40 iterations, with a separate final structured-output call when tools finish |
| Output per model call | 8,000 tokens |
| Model-call timeout | 180s |
| Shell-command timeout | 180s |
| Sandbox compute timeout | 30 minutes |
| Revision cycles | 2 |

## Task ownership and sandbox security

The server signs task identifiers and binds them to the role and authenticated caller. Another caller’s identifier doesn’t grant polling or cancellation rights. Workflow stores task content and results durably, outside public Blob storage. Keep `A2A_TASK_SECRET` stable: rotating it invalidates every existing task identifier.

Git uses the literal repository URL and a Connect credential that the sandbox firewall injects. Only the implementer has `push_branch`; it permits only `factory/*` branches and rejects protected names and the remote default branch. Arbitrary commands run sequentially, outside authenticated Git operations, without the app’s environment.

This server retains the factory’s sandbox threat model; don’t use it for anonymous execution of hostile code. Analysts, researchers, and reviewers can execute untrusted repository or web content in a sandbox. Restrict read roles through your organizational access policy too.

The server has no mark-ready, merge, shared-memory-write, or destructive preference tools. Draft creation requires independent reviewer approval, not human approval. This version has no A2A human-approval or resume flow.

## Deployment requirements and migration gaps

Configure the A2A Vercel project as Next.js with build command `pnpm a2a:build`. Don’t use `eve deploy` for this entry point; reserve it for the original eve application.

Workflow v5 beta requires the webpack scripts in this repository. The Next.js and Workflow layer uses extensionless imports for workflow discovery; existing eve imports retain `.js` extensions. Git ignores generated workflow routes, `.next`, and local workflow state.

Before production deployment, resolve these operational requirements:

- Configure platform rate limits, concurrency limits, and retention
- Test Connect, Blob, Sandbox, and model calls against a scratch repository
- Decide how clients handle duplicate requests and ambiguous submission failures
- Run a regression test for the retained GitHub integration

`messageId` isn’t a deduplication key: repeated `SendMessage` calls start new tasks. Don’t retry a timed-out submission without checking its outcome, especially for write roles.

Workflow replays completed checkpoints, but a process failure during a shell operation can leave side effects with an unknown outcome. The runtime doesn’t automatically retry tool exceptions. Before creating a PR, it checks for an existing open PR from the same branch.

Dependency installation reports a peer-version warning: `@github-tools/sdk` declares Workflow v4 compatibility, while this app requires Workflow v5 beta. The A2A runtime doesn’t import that SDK, but the retained GitHub integration still needs a live regression test.

These differences from eve remain:

- Each station clones the repository and runs setup instead of using eve’s cached template snapshots
- Research uses shell-based web access without a dedicated search provider
- The A2A server lacks eve’s native context compaction, per-user preferences, and interactive approval parking
- GitHub and Linear events don’t dispatch to the A2A server
