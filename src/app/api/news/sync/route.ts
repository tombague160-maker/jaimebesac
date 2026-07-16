import { NextResponse } from "next/server";
import { isAuthenticatedRequest, safeEqual } from "@/lib/auth";
import { syncNewsSources } from "@/lib/news/sync-news-sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasValidCronSecret(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return safeEqual(provided, expected);
}

export async function POST(request: Request) {
  // Fail-closed: only a logged-in user OR a caller with the CRON_SECRET may sync.
  const authorized = (await isAuthenticatedRequest(request)) || hasValidCronSecret(request);
  if (!authorized) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { limitPerSource?: unknown };
  const limitPerSource =
    typeof body.limitPerSource === "number" && body.limitPerSource > 0
      ? Math.min(body.limitPerSource, 50)
      : 20;

  const result = await syncNewsSources({ limitPerSource });
  return NextResponse.json(result);
}
