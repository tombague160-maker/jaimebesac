import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained build for Docker: `.next/standalone` + a minimal server.js.
  output: "standalone",
  // Keep the native better-sqlite3 module out of the server bundle so its .node
  // binary is required at runtime (also part of Next's default externals list).
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
