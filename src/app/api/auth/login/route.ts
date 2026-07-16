import { NextResponse } from "next/server";
import { SESSION_COOKIE, cookieSecure, createSessionToken, safeEqual, sessionTtlSeconds } from "@/lib/auth";
import { verifyPassword } from "@/lib/auth-password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.SESSION_SECRET;
  const email = process.env.AUTH_EMAIL;
  const passwordHash = process.env.AUTH_PASSWORD_HASH;

  if (!secret || !email || !passwordHash) {
    return NextResponse.json(
      { error: "Authentification non configurée (SESSION_SECRET, AUTH_EMAIL, AUTH_PASSWORD_HASH)." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Identifiants manquants." }, { status: 400 });
  }

  // Always run both checks so response timing does not reveal which one failed.
  const emailOk = safeEqual(body.email.trim().toLowerCase(), email.trim().toLowerCase());
  const passwordOk = verifyPassword(body.password, passwordHash);
  if (!emailOk || !passwordOk) {
    return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
  }

  const ttl = sessionTtlSeconds();
  const token = await createSessionToken(secret, ttl);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: ttl,
  });
  return response;
}
