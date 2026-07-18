import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Server-side session check for React Server Components (layouts/pages), where
 * there is no `Request` object — reads the cookie via `next/headers`. Route
 * handlers use `isAuthenticatedRequest` (auth.ts) instead. Kept in a `server-only`
 * module so `next/headers` never leaks into the Proxy/edge-agnostic `auth.ts`.
 */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(process.env.SESSION_SECRET, token);
}
