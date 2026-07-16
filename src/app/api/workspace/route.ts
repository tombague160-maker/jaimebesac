import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { clearWorkspace, readWorkspaceWithVersions } from "@/lib/workspace-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(request: Request) {
  return (await isAuthenticatedRequest(request))
    ? null
    : NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await readWorkspaceWithVersions());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de lecture des donnees." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await clearWorkspace());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de reinitialisation." },
      { status: 500 },
    );
  }
}
