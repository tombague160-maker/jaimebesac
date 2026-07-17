import "server-only";

// In-memory login throttle (single-instance self-host). Keyed by client IP
// (X-Forwarded-For behind the reverse proxy), it blocks after too many failures.

type Bucket = { count: number; resetAt: number; blockedUntil: number };

const globalForLimiter = globalThis as unknown as { loginBuckets?: Map<string, Bucket> };
const buckets = (globalForLimiter.loginBuckets ??= new Map<string, Bucket>());

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const BLOCK_MS = 15 * 60 * 1000;

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "global";
}

/** Milliseconds remaining while blocked, or 0 if not blocked. */
export function loginBlockedFor(key: string): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  const remaining = bucket.blockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS, blockedUntil: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count >= MAX_FAILURES) {
    bucket.blockedUntil = now + BLOCK_MS;
    bucket.count = 0;
    bucket.resetAt = now + BLOCK_MS;
  }
}

export function recordLoginSuccess(key: string): void {
  buckets.delete(key);
}
