import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { SendMessageRequest, TaskState } from "@a2a-js/sdk";
import { JsonRpcTransportHandler, ServerCallContext } from "@a2a-js/sdk/server";

process.env.FACTORY_REPO = "test/scratch";
process.env.LINEAR_CONNECTOR = "linear/test";
process.env.A2A_TASK_SECRET = "test-only-task-signing-secret-32-characters";
const { agentCard, createHandler, handleA2A, parseMessage } = await import(
  "../server/a2a.js"
);
const { authorizeRole, resolveTaskId, taskId } = await import(
  "../server/auth.js"
);
const { stampTrusted } = await import("../agent/lib/trust.js");
const { stationTools } = await import("../server/tools.js");
const { runPipeline } = await import("../agents/foreman/pipeline.js");
const { validateBranch } = await import("../agent/lib/github/git-remote.js");

test("git guards reject protected branches and command injection", () => {
  for (const branch of [
    "main",
    "master",
    "HEAD",
    "refs/heads/main",
    "factory/../../main",
    "factory/x;echo-secret",
    "factory/x\nmain",
  ]) {
    assert.ok(validateBranch(branch));
  }
  assert.equal(validateBranch("factory/fix-login"), null);
});
test("Foreman enforces station ordering and two revision cycles", async () => {
  const calls: string[] = [];
  const result = await runPipeline(
    { workItem: "Fix it" },
    (role) => {
      calls.push(role);
      if (role === "implementer") {
        return Promise.resolve({
          base: "main",
          branch: "factory/fix",
          pushed: true,
        });
      }
      if (role === "reviewer") {
        return Promise.resolve({ verdict: "request_changes" });
      }
      return Promise.resolve({});
    },
    () => {
      throw new Error("Must not create a PR for unapproved work");
    }
  );
  assert.equal(result.status, "review_failed");
  assert.deepEqual(calls, [
    "classifier",
    "analyst",
    "implementer",
    "reviewer",
    "implementer",
    "reviewer",
    "implementer",
    "reviewer",
  ]);
});

test("Foreman stops on clarification and creates drafts only after approval", async () => {
  const result = await runPipeline(
    { workItem: "Unclear" },
    () => Promise.resolve({ needs_clarification: true }),
    () => {
      throw new Error("Must not deliver");
    }
  );
  assert.equal(result.status, "needs_clarification");
  let delivered = false;
  const approved = await runPipeline(
    { workItem: "Fix" },
    (role) =>
      Promise.resolve(
        role === "implementer"
          ? { base: "main", branch: "factory/fix", pushed: true }
          : { verdict: "approve" }
      ),
    () => {
      delivered = true;
      return Promise.resolve({ draft: true, url: "https://example.test/pr" });
    }
  );
  assert.equal(approved.status, "draft_created");
  assert.equal(delivered, true);
});

const context = new ServerCallContext({ requestedVersion: "1.0" });
const message = (value: unknown) =>
  SendMessageRequest.fromJSON({
    configuration: { returnImmediately: true },
    message: { messageId: "test", parts: [{ data: value }], role: "ROLE_USER" },
  });

test("HTTP boundary rejects missing or forged credentials and oversized requests", async () => {
  const key = "test-only-jwt-signing-key-at-least-32-characters";
  process.env.A2A_JWT_SECRET = key;
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      aud: "factory-a2a",
      exp: Math.floor(Date.now() / 1000) + 60,
      iss: "factory-clients",
      sub: "test-user",
      trusted: "true",
    })
  ).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const token = `${unsigned}.${createHmac("sha256", key).update(unsigned).digest("base64url")}`;
  const request = (body: string, bearer = token) =>
    new Request("https://factory.example/a2a/classifier", {
      body,
      headers: { "A2A-Version": "1.0", Authorization: `Bearer ${bearer}` },
      method: "POST",
    });
  assert.equal(
    (await handleA2A(request("{}", "bad"), "classifier")).status,
    401
  );
  assert.equal((await handleA2A(request("{}"), "implementer")).status, 403);
  assert.equal(
    (await handleA2A(request("x".repeat(128_001)), "classifier")).status,
    413
  );
  delete process.env.A2A_JWT_SECRET;
});

test("every role advertises an independent A2A 1.0 interface", () => {
  for (const role of [
    "foreman",
    "classifier",
    "analyst",
    "implementer",
    "reviewer",
    "researcher",
  ] as const) {
    const card = agentCard(role, "https://factory.example");
    assert.equal(
      card.supportedInterfaces[0].url,
      `https://factory.example/a2a/${role}`
    );
    assert.equal(card.supportedInterfaces[0].protocolVersion, "1.0");
    assert.equal(card.capabilities?.streaming, false);
    assert.equal(
      card.securitySchemes.bearer.scheme?.$case,
      "httpAuthSecurityScheme"
    );
  }
});

test("signed task handles are bound to the caller and role", () => {
  const id = taskId("wrun_1", "analyst", "alice");
  assert.equal(resolveTaskId(id, "analyst", "alice"), "wrun_1");
  assert.equal(resolveTaskId(id, "reviewer", "alice"), null);
  assert.equal(resolveTaskId(id, "analyst", "bob"), null);
  assert.equal(resolveTaskId(`x${id}`, "analyst", "alice"), null);
  assert.equal(resolveTaskId("/../../brain", "analyst", "alice"), null);
});

test("write roles require server-stamped trust", () => {
  const auth = {
    attributes: {},
    authenticator: "test",
    principalId: "alice",
    principalType: "user" as const,
  };
  assert.equal(authorizeRole("analyst", auth), true);
  assert.equal(authorizeRole("implementer", auth), false);
  assert.equal(authorizeRole("foreman", auth), false);
  assert.equal(authorizeRole("implementer", stampTrusted(auth)), true);
});

test("direct roles enforce required context and reject client-selected auth", () => {
  assert.deepEqual(
    parseMessage("classifier", message({ workItem: "Classify this" })),
    { workItem: "Classify this" }
  );
  assert.throws(() =>
    parseMessage("implementer", message({ workItem: "Code it" }))
  );
  assert.throws(() =>
    parseMessage("reviewer", message({ workItem: "Approve it" }))
  );
  assert.throws(() =>
    parseMessage("analyst", message({ trusted: true, workItem: "Read it" }))
  );
  const followup = message({ workItem: "Read it" });
  assert.ok(followup.message);
  followup.message.taskId = "somebody-elses-task";
  assert.throws(() => parseMessage("analyst", followup));
});

test("tool surfaces do not expose pushes or shipping to other roles", () => {
  assert.deepEqual(Object.keys(stationTools("classifier")), []);
  assert.equal(Object.hasOwn(stationTools("reviewer"), "push_branch"), false);
  assert.equal(Object.hasOwn(stationTools("implementer"), "push_branch"), true);
  assert.equal(Object.hasOwn(stationTools("implementer"), "merge"), false);
});

test("A2A transport dispatches directly and preserves durable task state", async () => {
  const started: string[] = [];
  let status = "running";
  const backend = {
    cancel() {
      status = "cancelled";
      return Promise.resolve();
    },
    inspect() {
      return Promise.resolve({
        output: status === "completed" ? { answer: 42 } : undefined,
        status,
      });
    },
    start(role: string) {
      started.push(role);
      return Promise.resolve("wrun_test");
    },
  };
  const handler = createHandler(
    "analyst",
    "https://factory.example",
    "alice",
    backend
  );
  const transport = new JsonRpcTransportHandler(handler);
  const response = await transport.handle(
    {
      id: 1,
      jsonrpc: "2.0",
      method: "SendMessage",
      params: SendMessageRequest.toJSON(message({ workItem: "Plan it" })),
    },
    context
  );
  assert.ok(!(Symbol.asyncIterator in response));
  assert.equal(response.error, undefined);
  assert.deepEqual(started, ["analyst"]);
  const task = await handler.sendMessage(
    message({ workItem: "Plan it" }),
    context
  );
  assert.ok("id" in task);
  const params = { id: task.id, tenant: "" };
  assert.equal(
    (await handler.getTask(params, context)).status?.state,
    TaskState.TASK_STATE_WORKING
  );
  const stranger = createHandler(
    "analyst",
    "https://factory.example",
    "bob",
    backend
  );
  await assert.rejects(() => stranger.getTask(params, context));
  status = "completed";
  const done = await handler.getTask(params, context);
  assert.equal(done.status?.state, TaskState.TASK_STATE_COMPLETED);
  assert.deepEqual(done.artifacts[0].parts[0].content, {
    $case: "data",
    value: { answer: 42 },
  });
  await assert.rejects(() =>
    handler.cancelTask({ ...params, metadata: undefined }, context)
  );
});

test("unsupported blocking and streaming modes fail before starting work", async () => {
  let calls = 0;
  const handler = createHandler(
    "classifier",
    "https://factory.example",
    "alice",
    {
      cancel() {
        return Promise.resolve();
      },
      inspect() {
        return Promise.resolve({ status: "running" });
      },
      start() {
        calls += 1;
        return Promise.resolve("run");
      },
    }
  );
  const request = message({ workItem: "test" });
  assert.ok(request.configuration);
  request.configuration.returnImmediately = false;
  await assert.rejects(() => handler.sendMessage(request, context));
  assert.equal(calls, 0);
  assert.throws(() => handler.sendMessageStream(request, context));
});
