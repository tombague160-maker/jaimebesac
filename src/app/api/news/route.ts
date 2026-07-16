import { NextResponse } from "next/server";
import { todayIso } from "@/lib/dates";
import { createNewsItemSchema } from "@/lib/validation";
import { readWorkspaceValue, writeWorkspaceValue } from "@/lib/workspace-store";
import type { NewsItem } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await readWorkspaceValue("newsItems");
  return NextResponse.json(
    [...items].sort((a, b) => b.importanceScore - a.importanceScore || b.publishedAt.localeCompare(a.publishedAt)),
  );
}

export async function POST(request: Request) {
  const parsed = createNewsItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Actualite invalide", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const sources = await readWorkspaceValue("newsSources");
  const source = sources.find((entry) => entry.id === data.sourceId);
  const item: NewsItem = {
    id: `news-${crypto.randomUUID()}`,
    title: data.title,
    summary: data.summary,
    sourceId: data.sourceId,
    sourceName: source?.name ?? "Source manuelle",
    sourceUrl: source?.url ?? "",
    originalUrl: data.originalUrl,
    publishedAt: data.publishedAt || todayIso(),
    category: data.category as NewsItem["category"],
    tags: data.tags,
    importanceScore: data.importanceScore,
    urgencyLevel: data.urgencyLevel,
    editorialAngle: data.editorialAngle,
    status: data.status,
    notes: data.notes,
    contentIdeas: [],
    relatedPublicationIds: [],
    relatedCalendarEventIds: [],
  };
  const items = await readWorkspaceValue("newsItems");
  await writeWorkspaceValue("newsItems", [item, ...items]);
  return NextResponse.json(item, { status: 201 });
}
