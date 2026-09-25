import { AgentCard } from "@a2a-js/sdk";
import { roleSchema } from "../../../../../agents/registry";
import { agentCard } from "../../../../../server/a2a";

export async function GET(
  request: Request,
  context: { params: Promise<{ role: string }> }
) {
  const role = roleSchema.safeParse((await context.params).role);
  if (!role.success) {
    return new Response(null, { status: 404 });
  }
  return Response.json(
    AgentCard.toJSON(agentCard(role.data, new URL(request.url).origin))
  );
}
