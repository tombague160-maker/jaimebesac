import { NextResponse } from "next/server";
import { isWorkspaceKey, readWorkspaceValue, writeWorkspaceValue } from "@/lib/workspace-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ key: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { key } = await context.params;
  if (!isWorkspaceKey(key)) return NextResponse.json({ error: "Module inconnu." }, { status: 404 });

  return NextResponse.json({ value: await readWorkspaceValue(key) });
}

export async function PUT(request: Request, context: RouteContext) {
  const { key } = await context.params;
  if (!isWorkspaceKey(key)) return NextResponse.json({ error: "Module inconnu." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { value?: unknown } | null;
  if (!body || !("value" in body)) {
    return NextResponse.json({ error: "Donnees manquantes." }, { status: 400 });
  }

  const serialized = JSON.stringify(body.value);
  if (serialized.length > 2_000_000) {
    return NextResponse.json({ error: "Volume de donnees trop important." }, { status: 413 });
  }

  await writeWorkspaceValue(key, body.value as never);
  return NextResponse.json({ ok: true });
}
