import "server-only";

import Database from "better-sqlite3";
import { Redis } from "@upstash/redis";
import { createEmptyWorkspace } from "@/lib/workspace-defaults";
import type { WorkspaceData, WorkspaceKey } from "@/types";

const workspaceKeys = [
  "clients",
  "shootings",
  "publications",
  "calendarEvents",
  "reminders",
  "newsItems",
  "newsSources",
  "contentIdeas",
  "serviceOffers",
  "settings",
] as const satisfies readonly WorkspaceKey[];

const globalForStore = globalThis as unknown as {
  workspaceSqlite?: Database.Database;
  workspaceRedis?: Redis;
};

function hasRedisConfiguration() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function redisClient() {
  if (!hasRedisConfiguration()) return null;

  globalForStore.workspaceRedis ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return globalForStore.workspaceRedis;
}

function sqlitePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  return databaseUrl.startsWith("file:") ? databaseUrl.slice(5) : "./dev.db";
}

function sqliteClient() {
  if (process.env.VERCEL && !hasRedisConfiguration()) {
    throw new Error(
      "La persistance Vercel requiert UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN.",
    );
  }

  if (!globalForStore.workspaceSqlite) {
    const sqlite = new Database(sqlitePath());
    sqlite.pragma("journal_mode = WAL");
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS workspace_state (
        key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    globalForStore.workspaceSqlite = sqlite;
  }

  return globalForStore.workspaceSqlite;
}

function storageKey(key: WorkspaceKey) {
  return `jaime-besac:${process.env.WORKSPACE_ID ?? "main"}:${key}`;
}

export function isWorkspaceKey(value: string): value is WorkspaceKey {
  return workspaceKeys.includes(value as WorkspaceKey);
}

export async function readWorkspaceValue<K extends WorkspaceKey>(
  key: K,
): Promise<WorkspaceData[K]> {
  const redis = redisClient();
  if (redis) {
    const value = await redis.get<WorkspaceData[K]>(storageKey(key));
    return value ?? createEmptyWorkspace()[key];
  }

  const row = sqliteClient()
    .prepare("SELECT payload FROM workspace_state WHERE key = ?")
    .get(key) as { payload: string } | undefined;

  if (!row) return createEmptyWorkspace()[key];

  try {
    return JSON.parse(row.payload) as WorkspaceData[K];
  } catch {
    return createEmptyWorkspace()[key];
  }
}

export async function writeWorkspaceValue<K extends WorkspaceKey>(
  key: K,
  value: WorkspaceData[K],
) {
  const redis = redisClient();
  if (redis) {
    await redis.set(storageKey(key), value);
    return;
  }

  sqliteClient()
    .prepare(
      `INSERT INTO workspace_state (key, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    )
    .run(key, JSON.stringify(value), new Date().toISOString());
}

export async function readWorkspace(): Promise<WorkspaceData> {
  const entries = await Promise.all(
    workspaceKeys.map(async (key) => [key, await readWorkspaceValue(key)] as const),
  );

  return Object.fromEntries(entries) as unknown as WorkspaceData;
}

export async function clearWorkspace() {
  const empty = createEmptyWorkspace();
  await Promise.all(workspaceKeys.map((key) => writeWorkspaceValue(key, empty[key])));
  return empty;
}
