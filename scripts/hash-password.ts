// Generates a scrypt hash for AUTH_PASSWORD_HASH.
// Usage: npm run auth:hash -- "mon-mot-de-passe"
// Self-contained (no app imports) so it runs under tsx without the "server-only" guard.

import { randomBytes, scryptSync } from "node:crypto";

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run auth:hash -- "mon-mot-de-passe"');
  process.exit(1);
}

const salt = randomBytes(16);
const derived = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
const hash = `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${derived.toString("hex")}`;
const dockerHash = hash.replace(/\$/g, "$$$$"); // chaque $ doublé pour docker-compose

console.log("\n--- Fichier .env (un seul $) ---\n");
console.log(`AUTH_PASSWORD_HASH='${hash}'`);
console.log("\n--- docker-compose (environment:, $ DOUBLÉS) ---\n");
console.log(`      - AUTH_PASSWORD_HASH=${dockerHash}`);
console.log("");
