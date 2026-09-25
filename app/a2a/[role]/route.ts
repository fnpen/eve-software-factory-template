import { roleSchema } from "../../../agents/registry";
import { handleA2A } from "../../../server/a2a";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ role: string }> }
) {
  const role = roleSchema.safeParse((await context.params).role);
  if (!role.success) {
    return new Response(null, { status: 404 });
  }
  return handleA2A(request, role.data);
}
