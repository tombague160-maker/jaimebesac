import { NextResponse } from "next/server";
import { readWorkspaceValue } from "@/lib/workspace-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sources = await readWorkspaceValue("newsSources");
  return NextResponse.json(
    [...sources].sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.reliabilityScore - a.reliabilityScore),
  );
}
