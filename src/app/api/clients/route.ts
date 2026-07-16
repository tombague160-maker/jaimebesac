import { NextResponse } from "next/server";
import { todayIso } from "@/lib/dates";
import { getInitials } from "@/lib/utils";
import { createClientSchema } from "@/lib/validation";
import { readWorkspaceValue, writeWorkspaceValue } from "@/lib/workspace-store";
import type { Client } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const clients = await readWorkspaceValue("clients");
  return NextResponse.json([...clients].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export async function POST(request: Request) {
  const parsed = createClientSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Client invalide", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const today = todayIso();
  const client: Client = {
    id: `client-${crypto.randomUUID()}`,
    name: data.name,
    logo: getInitials(data.name),
    sector: data.sector,
    address: data.address,
    city: data.city,
    contactName: data.contactName,
    phone: data.phone,
    email: data.email,
    instagram: data.instagram,
    facebook: data.facebook,
    tiktok: data.tiktok,
    linkedin: data.linkedin,
    website: data.website,
    status: data.status,
    priority: data.priority,
    estimatedRevenue: data.estimatedRevenue,
    actualRevenue: data.actualRevenue,
    lastContactDate: data.lastContactDate || today,
    nextFollowUpDate: data.nextFollowUpDate,
    notes: data.notes,
    createdAt: today,
    updatedAt: today,
  };
  const clients = await readWorkspaceValue("clients");
  await writeWorkspaceValue("clients", [client, ...clients]);
  return NextResponse.json(client, { status: 201 });
}
