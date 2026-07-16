import "server-only";

import { createHash } from "node:crypto";
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

/** Content-hash version, used as an optimistic-concurrency token (ETag) for a key. */
export function workspaceVersion(value: unknown): string {
  return createHash("sha1").update(JSON.stringify(value ?? null)).digest("hex").slice(0, 16);
}

function defaultFor<K extends WorkspaceKey>(key: K): WorkspaceData[K] {
  return createEmptyWorkspace()[key];
}

export async function readWorkspaceValue<K extends WorkspaceKey>(
  key: K,
): Promise<WorkspaceData[K]> {
  const redis = redisClient();
  if (redis) {
    const value = await redis.get<WorkspaceData[K]>(storageKey(key));
    return value ?? defaultFor(key);
  }

  const row = sqliteClient()
    .prepare("SELECT payload FROM workspace_state WHERE key = ?")
    .get(key) as { payload: string } | undefined;

  if (!row) return defaultFor(key);

  try {
    const parsed = JSON.parse(row.payload) as WorkspaceData[K] | null;
    // Coalesce a stored `null`/`undefined` to the empty default so callers never
    // receive null for a collection (the Redis path already does this).
    return parsed ?? defaultFor(key);
  } catch {
    return defaultFor(key);
  }
}

/** Unchecked write. Used by server-side jobs (RSS sync) and full resets. */
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

export type WriteResult =
  | { ok: true; version: string }
  | { ok: false; conflict: true; currentVersion: string };

/**
 * Optimistic-concurrency write: only persists when `expectedVersion` matches the
 * current stored version. Prevents the last-write-wins data loss between tabs.
 * The SQLite path performs the compare-and-set inside a transaction (atomic,
 * since better-sqlite3 is synchronous).
 */
export async function writeWorkspaceValueChecked<K extends WorkspaceKey>(
  key: K,
  value: WorkspaceData[K],
  expectedVersion?: string | null,
): Promise<WriteResult> {
  const redis = redisClient();
  if (redis) {
    const current = (await redis.get<WorkspaceData[K]>(storageKey(key))) ?? defaultFor(key);
    const currentVersion = workspaceVersion(current);
    if (expectedVersion != null && expectedVersion !== currentVersion) {
      return { ok: false, conflict: true, currentVersion };
    }
    await redis.set(storageKey(key), value);
    return { ok: true, version: workspaceVersion(value) };
  }

  const db = sqliteClient();
  const run = db.transaction((): WriteResult => {
    const row = db.prepare("SELECT payload FROM workspace_state WHERE key = ?").get(key) as
      | { payload: string }
      | undefined;

    let current: WorkspaceData[K];
    if (!row) {
      current = defaultFor(key);
    } else {
      try {
        current = (JSON.parse(row.payload) as WorkspaceData[K] | null) ?? defaultFor(key);
      } catch {
        current = defaultFor(key);
      }
    }

    const currentVersion = workspaceVersion(current);
    if (expectedVersion != null && expectedVersion !== currentVersion) {
      return { ok: false, conflict: true, currentVersion };
    }

    db.prepare(
      `INSERT INTO workspace_state (key, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    ).run(key, JSON.stringify(value), new Date().toISOString());

    return { ok: true, version: workspaceVersion(value) };
  });

  return run();
}

export async function readWorkspace(): Promise<WorkspaceData> {
  const entries = await Promise.all(
    workspaceKeys.map(async (key) => [key, await readWorkspaceValue(key)] as const),
  );

  return Object.fromEntries(entries) as unknown as WorkspaceData;
}

/** Full workspace plus a per-key version map (for optimistic concurrency on the client). */
export async function readWorkspaceWithVersions(): Promise<{
  data: WorkspaceData;
  versions: Record<WorkspaceKey, string>;
}> {
  const data = await readWorkspace();
  const versions = Object.fromEntries(
    workspaceKeys.map((key) => [key, workspaceVersion(data[key])]),
  ) as Record<WorkspaceKey, string>;
  return { data, versions };
}

export async function clearWorkspace() {
  const empty = createEmptyWorkspace();
  await Promise.all(workspaceKeys.map((key) => writeWorkspaceValue(key, empty[key])));
  return empty;
}
