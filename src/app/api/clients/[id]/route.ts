import { NextResponse } from "next/server";
import { todayIso } from "@/lib/dates";
import { getInitials } from "@/lib/utils";
import { updateClientSchema } from "@/lib/validation";
import { readWorkspaceValue, writeWorkspaceValue } from "@/lib/workspace-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = updateClientSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Mise a jour client invalide" }, { status: 400 });
  }

  const clients = await readWorkspaceValue("clients");
  const existing = clients.find((client) => client.id === id);
  if (!existing) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const data = parsed.data;
  const updated = {
    ...existing,
    ...data,
    ...(data.name ? { logo: getInitials(data.name) } : {}),
    updatedAt: todayIso(),
  };
  await writeWorkspaceValue("clients", clients.map((client) => (client.id === id ? updated : client)));
  return NextResponse.json(updated);
}
