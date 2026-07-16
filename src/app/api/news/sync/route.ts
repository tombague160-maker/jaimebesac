import { NextResponse } from "next/server";
import { syncNewsSources } from "@/lib/news/sync-news-sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (process.env.NODE_ENV === "production" && expectedSecret && providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limitPerSource =
    typeof body.limitPerSource === "number" && body.limitPerSource > 0 ? Math.min(body.limitPerSource, 50) : 20;

  const result = await syncNewsSources({ limitPerSource });
  return NextResponse.json(result);
}
