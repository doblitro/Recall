import { SearchItemInput } from "./types";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client";
import { searchItems } from "../db/schema";

const CHUNK_SIZE = 50;

function chunksOf<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const NULL_BYTE = String.fromCharCode(0);

// Postgres text/jsonb columns reject the NUL byte outright ("invalid byte
// sequence for encoding UTF8: 0x00") — real-world email/file content
// occasionally contains one (malformed mail, binary garbage misencoded as
// text), so strip it recursively from every string before it reaches the DB.
function stripNullBytes(value: unknown): unknown {
  if (typeof value === "string") return value.split(NULL_BYTE).join("");
  if (Array.isArray(value)) return value.map(stripNullBytes);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, stripNullBytes(val)]),
    );
  }
  return value;
}

function sanitizeItem(item: SearchItemInput): SearchItemInput {
  return {
    ...item,
    title: stripNullBytes(item.title) as string,
    participants: stripNullBytes(item.participants) as string,
    snippet: item.snippet
      ? (stripNullBytes(item.snippet) as string)
      : item.snippet,
    bodyText: item.bodyText
      ? (stripNullBytes(item.bodyText) as string)
      : item.bodyText,
    metadata: stripNullBytes(item.metadata),
  };
}

export async function upsertSearchItems(
  userId: string,
  integrationId: string,
  provider: string,
  items: SearchItemInput[],
): Promise<number> {
  if (items.length === 0) return 0;

  const db = getDb();
  let upserted = 0;

  for (const chunk of chunksOf(items, CHUNK_SIZE)) {
    const queries = chunk.map((rawItem) => {
      const item = sanitizeItem(rawItem);
      return db
        .insert(searchItems)
        .values({ userId, integrationId, provider, ...item })
        .onConflictDoUpdate({
          target: [searchItems.integrationId, searchItems.externalId],
          set: {
            title: item.title,
            participants: item.participants,
            snippet: item.snippet,
            bodyText: item.bodyText,
            url: item.url,
            updatedAt: item.updatedAt,
            metadata: item.metadata,
            syncedAt: new Date(),
          },
        });
    });

    try {
      // db.batch requires a non-empty tuple type; chunk is always non-empty here.
      await db.batch(
        queries as [(typeof queries)[number], ...(typeof queries)[number][]],
      );
      upserted += chunk.length;
    } catch (error) {
      // One bad chunk (e.g. a still-unforeseen encoding issue) must not
      // discard progress already made on — or still to come from — the
      // rest of a large sync.
      console.error("[sync] upsert chunk failed", {
        integrationId,
        chunkSize: chunk.length,
        name: error instanceof Error ? error.name : "unknown",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return upserted;
}

export async function deleteSearchItems(
  integrationId: string,
  externalIds: string[],
): Promise<number> {
  if (externalIds.length === 0) return 0;

  const db = getDb();
  const deleted = await db
    .delete(searchItems)
    .where(
      and(
        eq(searchItems.integrationId, integrationId),
        inArray(searchItems.externalId, externalIds),
      ),
    )
    .returning({ id: searchItems.id });
  return deleted.length;
}
