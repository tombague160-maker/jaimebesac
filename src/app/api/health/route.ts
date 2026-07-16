import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public endpoint for container healthchecks (excluded from the auth proxy).
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
