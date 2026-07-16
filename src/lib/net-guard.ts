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

function isBlockedV6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0]; // drop zone id
  if (addr === "::1" || addr === "::") return true;
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedV4(mapped[1]);
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // ULA fc00::/7
  if (/^fe[89ab]/.test(addr)) return true; // link-local fe80::/10
  if (addr.startsWith("ff")) return true; // multicast
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
