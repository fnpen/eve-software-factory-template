import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { jwtHmac, vercelOidc } from "eve/channels/auth";
import type { SessionAuthContext } from "eve/context";
import {
  isTrusted,
  stampTrusted,
  TRUSTED_ATTRIBUTE,
} from "../agent/lib/trust.js";
import { agents, type Role } from "../agents/registry.js";

export const authenticate = async (
  request: Request
): Promise<SessionAuthContext | null> => {
  const secret = process.env.A2A_JWT_SECRET;
  const auth = secret
    ? await jwtHmac({
        algorithm: "HS256",
        audiences: ["factory-a2a"],
        issuer: process.env.A2A_JWT_ISSUER ?? "factory-clients",
        secret,
      })(request)
    : await vercelOidc()(request);
  if (!auth) {
    return null;
  }
  // Only deployment-owned configuration grants write authority, never message metadata.
  const trusted = (process.env.A2A_TRUSTED_PRINCIPALS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const sanitized = {
    ...auth,
    attributes: { ...auth.attributes, [TRUSTED_ATTRIBUTE]: "false" },
  };
  return trusted.includes(auth.principalId)
    ? stampTrusted(sanitized)
    : sanitized;
};

export const authorizeRole = (role: Role, auth: SessionAuthContext) =>
  !agents[role].requiresTrust || isTrusted(auth);

export const ownerId = (auth: SessionAuthContext) =>
  createHash("sha256")
    .update(
      JSON.stringify([auth.authenticator, auth.principalType, auth.principalId])
    )
    .digest("hex");

const signingKey = () => {
  const key = process.env.A2A_TASK_SECRET;
  if (!key || key.length < 32) {
    throw new Error("A2A_TASK_SECRET must contain at least 32 characters.");
  }
  return key;
};

// A signed, owner-bound handle avoids a second task database. Workflow owns durable state.
export const taskId = (runId: string, role: Role, owner: string) => {
  const payload = Buffer.from(JSON.stringify({ owner, role, runId })).toString(
    "base64url"
  );
  return `${payload}.${createHmac("sha256", signingKey()).update(payload).digest("base64url")}`;
};

export const resolveTaskId = (
  id: string,
  role: Role,
  owner: string
): string | null => {
  if (id.length > 2000) {
    return null;
  }
  const [payload, signature, extra] = id.split(".");
  if (!(payload && signature) || extra) {
    return null;
  }
  const expected = createHmac("sha256", signingKey()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return decoded.role === role &&
      decoded.owner === owner &&
      typeof decoded.runId === "string"
      ? decoded.runId
      : null;
  } catch {
    return null;
  }
};
