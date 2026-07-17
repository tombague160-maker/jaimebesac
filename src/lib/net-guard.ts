import "server-only";

import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

// Blocks Server-Side Request Forgery on outbound RSS fetches: only http/https,
// no loopback / private / link-local / cloud-metadata targets. The hostname is
// resolved and every returned address is checked before fetching.

function isBlockedV4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24
  if (a >= 224) return true; // multicast + reserved
  return false;
}

// Expand any IPv6 form (compressed `::`, embedded dotted IPv4) to its 8 hextets.
// Returns null on anything unparseable (treated as unsafe by the caller).
function expandV6(input: string): number[] | null {
  let addr = input;

  // Trailing embedded IPv4 (e.g. ::ffff:1.2.3.4) → convert to two hextets.
  const lastColon = addr.lastIndexOf(":");
  const tail = addr.slice(lastColon + 1);
  if (tail.includes(".")) {
    const octets = tail.split(".").map(Number);
    if (octets.length !== 4 || octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) return null;
    const g6 = ((octets[0] << 8) | octets[1]).toString(16);
    const g7 = ((octets[2] << 8) | octets[3]).toString(16);
    addr = `${addr.slice(0, lastColon + 1)}${g6}:${g7}`;
  }

  const halves = addr.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];

  const groups: number[] = [];
  for (const g of left) groups.push(parseInt(g || "0", 16));
  if (halves.length === 2) {
    const missing = 8 - (left.length + right.length);
    if (missing < 0) return null;
    for (let i = 0; i < missing; i += 1) groups.push(0);
  }
  for (const g of right) groups.push(parseInt(g || "0", 16));

  if (groups.length !== 8 || groups.some((g) => Number.isNaN(g) || g < 0 || g > 0xffff)) return null;
  return groups;
}

function isBlockedV6(ip: string): boolean {
  const groups = expandV6(ip.toLowerCase().split("%")[0]); // drop zone id
  if (!groups) return true; // unparseable → unsafe

  const isZeroPrefix = groups.slice(0, 5).every((g) => g === 0);
  // Unspecified (::) and loopback (::1)
  if (isZeroPrefix && groups[5] === 0 && groups[6] === 0 && (groups[7] === 0 || groups[7] === 1)) {
    return true;
  }
  // IPv4-mapped (::ffff:x.x.x.x, incl. hex form ::ffff:HHHH:HHHH) and IPv4-compatible
  if (isZeroPrefix && (groups[5] === 0xffff || groups[5] === 0)) {
    const v4 = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`;
    return isBlockedV4(v4);
  }
  const first = groups[0];
  if ((first & 0xfe00) === 0xfc00) return true; // ULA fc00::/7
  if ((first & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((first & 0xff00) === 0xff00) return true; // multicast ff00::/8
  return false;
}

function isBlockedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isBlockedV4(address);
  if (family === 6) return isBlockedV6(address);
  return true; // not a resolvable IP → treat as unsafe
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL invalide.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Schema d'URL non autorise (http/https uniquement).");
  }

  const hostname = url.hostname.replace(/^\[/, "").replace(/\]$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Hote non autorise.");
  }

  let addresses: string[];
  if (isIP(hostname)) {
    addresses = [hostname];
  } else {
    const resolved = await lookup(hostname, { all: true });
    addresses = resolved.map((entry) => entry.address);
    if (addresses.length === 0) throw new Error("Resolution DNS impossible.");
  }

  for (const address of addresses) {
    if (isBlockedAddress(address)) {
      throw new Error("Adresse reseau interne bloquee (SSRF).");
    }
  }

  return url;
}
