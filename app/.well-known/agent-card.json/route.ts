import { AgentCard } from "@a2a-js/sdk";
import { agentCard } from "../../../server/a2a";

export const GET = (request: Request) =>
  Response.json(
    AgentCard.toJSON(agentCard("foreman", new URL(request.url).origin))
  );
