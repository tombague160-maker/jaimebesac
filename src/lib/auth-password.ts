import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// scrypt parameters (interactive-login safe). Encoded into the hash so future
// changes stay verifiable against existing hashes.
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

/** Produces `scrypt$N$r$p$saltHex$hashHex`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const segments = stored.split("$");
  if (segments.length !== 6 || segments[0] !== "scrypt") return false;

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = segments;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(nRaw),
      r: Number(rRaw),
      p: Number(pRaw),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
