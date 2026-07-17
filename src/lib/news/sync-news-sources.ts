import { createHash } from "node:crypto";
import Parser from "rss-parser";
import { categorizeNewsItem } from "@/lib/news/categorize-news-item";
import { scoreNewsItem, urgencyFromScore } from "@/lib/news/score-news-item";
import { suggestEditorialAngle } from "@/lib/news/suggest-editorial-angle";
import { assertPublicHttpUrl } from "@/lib/net-guard";
import {
  readWorkspaceValue,
  workspaceVersion,
  writeWorkspaceValueChecked,
} from "@/lib/workspace-store";
import { toDateOnly } from "@/lib/dates";
import type { NewsCategory, NewsItem, Priority } from "@/types";

const parser = new Parser();

// Hard cap on sources processed per sync run (defense against a flood of sources
// added via the API turning one sync into a long-running / DoS operation).
const MAX_SOURCES_PER_SYNC = 50;

// Hard cap on total stored news items (prevents unbounded growth that would
// eventually make the module exceed the 2 MB write limit → 413 on UI saves).
function maxNewsItems() {
  const parsed = Number(process.env.NEWS_MAX_ITEMS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
}

/**
 * Merge freshly imported items into the current stored list with optimistic
 * concurrency: re-read, dedupe by originalUrl, prepend, cap, compare-and-set.
 * Retries on conflict so a concurrent UI edit of `newsItems` is never clobbered.
 */
async function mergeImportedNewsItems(imported: NewsItem[]) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await readWorkspaceValue("newsItems");
    const known = new Set(current.map((item) => item.originalUrl).filter(Boolean));
    const fresh = imported.filter((item) => !known.has(item.originalUrl));
    if (fresh.length === 0) return;

    const merged = [...fresh, ...current].slice(0, maxNewsItems());
    const result = await writeWorkspaceValueChecked(
      "newsItems",
      merged,
      workspaceVersion(current),
    );
    if (result.ok) return;
    // Conflict: someone changed newsItems in the meantime → re-read and retry.
  }
}

function fetchTimeoutMs() {
  const parsed = Number(process.env.NEWS_FETCH_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
}

type SyncOptions = {
  limitPerSource?: number;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function stableFallbackUrl(sourceUrl: string, title: string) {
  const hash = createHash("sha1").update(`${sourceUrl}:${title}`).digest("hex").slice(0, 12);
  return `${sourceUrl.replace(/\/$/, "")}#${hash}`;
}

function parsePublishedAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchRssFeed(url: string) {
  // Block SSRF (internal/loopback/metadata targets) before making the request.
  await assertPublicHttpUrl(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeoutMs());
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": process.env.NEWS_SYNC_USER_AGENT ?? "JaimeBesacStudio/1.0",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      // Do not follow redirects: a 3xx to an internal host would bypass the guard.
      redirect: "error",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Flux indisponible (${response.status})`);
    }

    return parser.parseString(await response.text());
  } finally {
    clearTimeout(timer);
  }
}

export async function syncNewsSources({ limitPerSource = 20 }: SyncOptions = {}) {
  const startedAt = Date.now();
  const sources = (await readWorkspaceValue("newsSources"))
    .filter((source) => source.isActive)
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore || a.name.localeCompare(b.name))
    .slice(0, MAX_SOURCES_PER_SYNC);
  const items = await readWorkspaceValue("newsItems");
  const knownUrls = new Set(items.map((item) => item.originalUrl).filter(Boolean));
  const importedItems: NewsItem[] = [];

  const totals = {
    sources: sources.length,
    fetchedCount: 0,
    addedCount: 0,
    duplicateCount: 0,
    skippedCount: 0,
    errorCount: 0,
    durationMs: 0,
  };

  for (const source of sources) {
    if (!source.rssUrl) {
      totals.skippedCount += 1;
      continue;
    }

    try {
      const feed = await fetchRssFeed(source.rssUrl);
      let fetchedCount = 0;
      let addedCount = 0;
      let duplicateCount = 0;

      for (const entry of feed.items.slice(0, limitPerSource)) {
        const title = String(entry.title ?? "").trim();
        if (!title) continue;

        fetchedCount += 1;

        const originalUrl = String(entry.link || entry.guid || stableFallbackUrl(source.url, title));
        if (knownUrls.has(originalUrl)) {
          duplicateCount += 1;
          continue;
        }

        const publishedAt = parsePublishedAt(entry.isoDate || entry.pubDate);
        const summary = stripHtml(entry.contentSnippet || entry.content || "");
        const categories = Array.isArray(entry.categories) ? entry.categories.map(String) : [];
        const category = categorizeNewsItem(title, summary, categories);
        const importanceScore = scoreNewsItem({
          title,
          summary,
          sourceReliability: source.reliabilityScore,
          publishedAt,
        });

        importedItems.push({
          id: `news-rss-${createHash("sha1").update(originalUrl).digest("hex").slice(0, 16)}`,
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: source.url,
          title,
          summary: summary.slice(0, 900),
          originalUrl,
          publishedAt: toDateOnly(publishedAt),
          category: category as NewsCategory,
          tags: [...new Set([...categories, source.category])].slice(0, 8),
          importanceScore,
          urgencyLevel: urgencyFromScore(importanceScore) as Priority,
          editorialAngle: suggestEditorialAngle(category, title),
          status: importanceScore >= 75 ? "interesting" : "to_read",
          notes: "",
          contentIdeas: [],
          relatedPublicationIds: [],
          relatedCalendarEventIds: [],
        });
        knownUrls.add(originalUrl);

        addedCount += 1;
      }

      totals.fetchedCount += fetchedCount;
      totals.addedCount += addedCount;
      totals.duplicateCount += duplicateCount;
    } catch (error) {
      void error;
      totals.errorCount += 1;
    }
  }

  if (importedItems.length) {
    await mergeImportedNewsItems(importedItems);
  }

  totals.durationMs = Date.now() - startedAt;
  return totals;
}
