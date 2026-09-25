import {
  AgentCard,
  Role as MessageRole,
  type SendMessageRequest,
  type StreamResponse,
  Task,
  TaskState,
} from "@a2a-js/sdk";
import {
  RequestMalformedError,
  TaskNotCancelableError,
  TaskNotFoundError,
  UnsupportedOperationError,
} from "@a2a-js/sdk/errors";
import {
  type A2ARequestHandler,
  JsonRpcTransportHandler,
  ServerCallContext,
} from "@a2a-js/sdk/server";
import { getRun, start } from "workflow/api";
import { agents, type Role, validateTaskInput } from "../agents/registry";
import type { TaskInput } from "../agents/task-input";
import {
  authenticate,
  authorizeRole,
  ownerId,
  resolveTaskId,
  taskId,
} from "./auth";
import { factoryWorkflow } from "./workflow";

export const agentCard = (role: Role, origin: string) =>
  AgentCard.fromJSON({
    capabilities: { pushNotifications: false, streaming: false },
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    description: agents[role].description,
    name: role,
    securityRequirements: [{ schemes: { bearer: { list: [] } } }],
    securitySchemes: {
      bearer: {
        httpAuthSecurityScheme: {
          bearerFormat: "JWT",
          description:
            "Deployment-verified JWT. Write roles require a trusted principal.",
          scheme: "Bearer",
        },
      },
    },
    skills: [
      {
        description: agents[role].description,
        id: role,
        name: role,
        tags: ["software-factory", role],
      },
    ],
    supportedInterfaces: [
      {
        protocolBinding: "JSONRPC",
        protocolVersion: "1.0",
        url: `${origin}/a2a/${role}`,
      },
    ],
    version: "1.0.0",
  });

export const parseMessage = (
  role: Role,
  params: SendMessageRequest
): TaskInput => {
  const { message } = params;
  if (
    !message ||
    message.role !== MessageRole.ROLE_USER ||
    message.taskId ||
    message.contextId ||
    message.referenceTaskIds.length ||
    params.tenant
  ) {
    throw new RequestMalformedError({
      message:
        "Send a new user task without taskId, contextId, references or tenant.",
    });
  }
  if (params.configuration?.taskPushNotificationConfig) {
    throw new UnsupportedOperationError();
  }
  if (
    message.parts.length !== 1 ||
    message.parts[0].content?.$case !== "data"
  ) {
    throw new RequestMalformedError({
      message: "Send exactly one data part containing the role input object.",
    });
  }
  try {
    return validateTaskInput(role, message.parts[0].content.value);
  } catch (cause) {
    // biome-ignore lint/style/useErrorCause: A2A errors take cause in their first options argument.
    throw new RequestMalformedError({
      cause,
      message: "Invalid role input. See docs/A2A.md for required fields.",
    });
  }
};

export interface TaskBackend {
  cancel: (runId: string) => Promise<void>;
  inspect: (
    runId: string
  ) => Promise<{ status: string; output?: Record<string, unknown> }>;
  start: (role: Role, input: TaskInput) => Promise<string>;
}
const workflowBackend: TaskBackend = {
  async cancel(id) {
    await getRun(id).cancel();
  },
  async inspect(id) {
    const run = getRun<Record<string, unknown>>(id);
    const status = await run.status;
    return {
      output: status === "completed" ? await run.returnValue : undefined,
      status,
    };
  },
  async start(role, input) {
    return (await start(factoryWorkflow, [role, input])).runId;
  },
};

const unsupported = () => {
  throw new UnsupportedOperationError();
};
const unsupportedStream = (): AsyncGenerator<
  StreamResponse,
  void,
  undefined
> => {
  throw new UnsupportedOperationError();
};

export const createHandler = (
  role: Role,
  origin: string,
  owner: string,
  backend: TaskBackend = workflowBackend
): A2ARequestHandler => {
  const lookup = (id: string) => {
    const runId = resolveTaskId(id, role, owner);
    if (!runId) {
      throw new TaskNotFoundError();
    }
    return runId;
  };
  const getTask = async ({ id }: { id: string }) => {
    const runId = lookup(id);
    let run: Awaited<ReturnType<TaskBackend["inspect"]>>;
    try {
      run = await backend.inspect(runId);
    } catch (cause) {
      // biome-ignore lint/style/useErrorCause: A2A errors take cause in their first options argument.
      throw new TaskNotFoundError({ cause });
    }
    const states: Record<string, TaskState> = {
      canceled: TaskState.TASK_STATE_CANCELED,
      cancelled: TaskState.TASK_STATE_CANCELED,
      completed: TaskState.TASK_STATE_COMPLETED,
      failed: TaskState.TASK_STATE_FAILED,
      pending: TaskState.TASK_STATE_SUBMITTED,
      running: TaskState.TASK_STATE_WORKING,
    };
    return Task.fromJSON({
      artifacts: run.output
        ? [
            {
              artifactId: "result",
              name: "result",
              parts: [{ data: run.output, mediaType: "application/json" }],
            },
          ]
        : [],
      contextId: id,
      id,
      status: { state: states[run.status] ?? TaskState.TASK_STATE_WORKING },
    });
  };
  return {
    async cancelTask(params) {
      const current = await getTask(params);
      if (
        [
          TaskState.TASK_STATE_COMPLETED,
          TaskState.TASK_STATE_FAILED,
          TaskState.TASK_STATE_CANCELED,
        ].includes(current.status?.state ?? TaskState.TASK_STATE_UNSPECIFIED)
      ) {
        throw new TaskNotCancelableError();
      }
      // Cancellation does not undo already executed commands or pushes.
      await backend.cancel(lookup(params.id));
      return getTask(params);
    },
    createTaskPushNotificationConfig: unsupported,
    deleteTaskPushNotificationConfig: unsupported,
    getAgentCard: async () => agentCard(role, origin),
    getAuthenticatedExtendedAgentCard: unsupported,
    getTask,
    getTaskPushNotificationConfig: unsupported,
    listTaskPushNotificationConfigs: unsupported,
    listTasks: unsupported,
    resubscribe: unsupportedStream,
    async sendMessage(params) {
      const input = parseMessage(role, params);
      // Long coding jobs must not depend on an HTTP connection staying alive.
      if (!params.configuration?.returnImmediately) {
        throw new UnsupportedOperationError({
          message: "Set configuration.returnImmediately=true and poll GetTask.",
        });
      }
      // Validate signing configuration BEFORE starting billable work.
      taskId("preflight", role, owner);
      const id = taskId(await backend.start(role, input), role, owner);
      return Task.fromJSON({
        contextId: id,
        id,
        status: { state: TaskState.TASK_STATE_SUBMITTED },
      });
    },
    sendMessageStream: unsupportedStream,
  };
};

export const handleA2A = async (request: Request, role: Role) => {
  const headers = { "A2A-Version": "1.0", "Cache-Control": "no-store" };
  let auth: Awaited<ReturnType<typeof authenticate>> = null;
  try {
    auth = await authenticate(request);
  } catch {
    auth = null;
  }
  if (!auth) {
    return Response.json(
      { error: "Unauthorized" },
      { headers: { ...headers, "WWW-Authenticate": "Bearer" }, status: 401 }
    );
  }
  if (!authorizeRole(role, auth)) {
    return Response.json(
      { error: "Role requires a trusted principal" },
      { headers, status: 403 }
    );
  }
  if (request.headers.get("A2A-Version") !== "1.0") {
    return Response.json(
      { error: "Send A2A-Version: 1.0" },
      { headers, status: 400 }
    );
  }
  // Bound streaming reads as well as Content-Length, which clients can omit.
  const reader = request.body?.getReader();
  if (!reader) {
    return new Response(null, { status: 400 });
  }
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    // biome-ignore lint/performance/noAwaitInLoops: Bound each network chunk before reading the next.
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    size += chunk.value.byteLength;
    if (size > 128_000) {
      await reader.cancel();
      return new Response(null, { status: 413 });
    }
    chunks.push(chunk.value);
  }
  const transport = new JsonRpcTransportHandler(
    createHandler(role, new URL(request.url).origin, ownerId(auth))
  );
  const result = await transport.handle(
    Buffer.concat(chunks).toString("utf8"),
    new ServerCallContext({ requestedVersion: "1.0" })
  );
  if (Symbol.asyncIterator in result) {
    return Response.json(
      { error: "Streaming is not supported" },
      { headers, status: 400 }
    );
  }
  return Response.json(result, { headers });
};
