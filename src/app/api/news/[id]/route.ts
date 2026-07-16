import { NextResponse } from "next/server";
import { updateNewsItemSchema } from "@/lib/validation";
import { readWorkspaceValue, writeWorkspaceValue } from "@/lib/workspace-store";
import type { NewsItem } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = updateNewsItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Mise a jour actualite invalide" }, { status: 400 });
  }

  const items = await readWorkspaceValue("newsItems");
  const existing = items.find((item) => item.id === id);
  if (!existing) return NextResponse.json({ error: "Actualite introuvable" }, { status: 404 });

  const updated = { ...existing, ...parsed.data } as NewsItem;
  await writeWorkspaceValue("newsItems", items.map((item) => (item.id === id ? updated : item)));
  return NextResponse.json(updated);
}
