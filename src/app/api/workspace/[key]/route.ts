import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { validateWorkspaceValue } from "@/lib/workspace-schemas";
import {
  isWorkspaceKey,
  readWorkspaceValue,
  workspaceVersion,
  writeWorkspaceValueChecked,
} from "@/lib/workspace-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ key: string }>;
};

async function guard(request: Request) {
  return (await isAuthenticatedRequest(request))
    ? null
    : NextResponse.json({ error: "Non authentifié." }, { status: 401 });
}

export async function GET(request: Request, context: RouteContext) {
  const denied = await guard(request);
  if (denied) return denied;

  const { key } = await context.params;
  if (!isWorkspaceKey(key)) return NextResponse.json({ error: "Module inconnu." }, { status: 404 });

  const value = await readWorkspaceValue(key);
  return NextResponse.json({ value, version: workspaceVersion(value) });
}

export async function PUT(request: Request, context: RouteContext) {
  const denied = await guard(request);
  if (denied) return denied;

  const { key } = await context.params;
  if (!isWorkspaceKey(key)) return NextResponse.json({ error: "Module inconnu." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as
    | { value?: unknown; version?: unknown }
    | null;
  if (!body || !("value" in body)) {
    return NextResponse.json({ error: "Donnees manquantes." }, { status: 400 });
  }

  const serialized = JSON.stringify(body.value);
  if (serialized.length > 2_000_000) {
    return NextResponse.json({ error: "Volume de donnees trop important." }, { status: 413 });
  }

  const validation = validateWorkspaceValue(key, body.value);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  // A version token is mandatory: it is always available client-side (the initial
  // GET returns one per key, even for empty modules). Requiring it makes the
  // optimistic-concurrency check non-optional — no blind overwrite by omission.
  if (typeof body.version !== "string") {
    return NextResponse.json({ error: "Version manquante (concurrence)." }, { status: 428 });
  }

  const result = await writeWorkspaceValueChecked(key, validation.value as never, body.version);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Conflit de version : ces donnees ont ete modifiees ailleurs.", currentVersion: result.currentVersion },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, version: result.version });
}
