import { NextResponse } from "next/server";
import { clearWorkspace, readWorkspace } from "@/lib/workspace-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await readWorkspace());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de lecture des donnees." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    return NextResponse.json(await clearWorkspace());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de reinitialisation." },
      { status: 500 },
    );
  }
}
