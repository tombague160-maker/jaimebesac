// Session helpers usable from both the Proxy (Node.js runtime in Next 16) and
// Route Handlers. Uses Web Crypto (available in every Next runtime) so the same
// code verifies the signed session cookie everywhere. No Node-only imports here.

export const SESSION_COOKIE = "jb_session";

const encoder = new TextEncoder();

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ArrayBuffer-backed byte helpers so the values satisfy `BufferSource` for
// crypto.subtle across TS lib versions (a plain `new Uint8Array(n)` can widen to
// ArrayBufferLike/SharedArrayBuffer).
function encodeUtf8(text: string): Uint8Array<ArrayBuffer> {
  const source = encoder.encode(text);
  const bytes = new Uint8Array(new ArrayBuffer(source.byteLength));
  bytes.set(source);
  return bytes;
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encodeUtf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Signed, expiring session token: `base64url(payload).base64url(hmac)`. */
export async function createSessionToken(secret: string, ttlSeconds: number): Promise<string> {
  const payload = JSON.stringify({ exp: nowSeconds() + ttlSeconds });
  const payloadPart = toBase64Url(encodeUtf8(payload));
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), encodeUtf8(payloadPart)),
  );
  return `${payloadPart}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(
  secret: string | undefined,
  token: string | undefined | null,
): Promise<boolean> {
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadPart, signaturePart] = parts;

  let signature: Uint8Array<ArrayBuffer>;
  try {
    signature = fromBase64Url(signaturePart);
  } catch {
    return false;
  }

  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    signature,
    encodeUtf8(payloadPart),
  );
  if (!valid) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadPart))) as {
      exp?: unknown;
    };
    return typeof payload.exp === "number" && payload.exp > nowSeconds();
  } catch {
    return false;
  }
}

/** Reads the session cookie from a raw Cookie header (for defense-in-depth guards in routes). */
export function readSessionCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** Returns true when the request carries a valid session. Use as a per-route guard. */
export async function isAuthenticatedRequest(request: Request): Promise<boolean> {
  const token = readSessionCookie(request.headers.get("cookie"));
  return verifySessionToken(process.env.SESSION_SECRET, token);
}

/** Constant-time-ish equality for short secrets (email, bearer). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export function sessionTtlSeconds(): number {
  const parsed = Number(process.env.SESSION_TTL_SECONDS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60 * 60 * 24 * 30;
}

/**
 * Whether the session cookie is marked `Secure`. Default: true in production.
 * Set COOKIE_SECURE=false for a plain-HTTP LAN deployment (a browser refuses a
 * Secure cookie over http://, which would break login). Use HTTPS in production.
 */
export function cookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production";
}
