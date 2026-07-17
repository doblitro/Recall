import { sql } from "drizzle-orm";
import { getDb } from "../db/client";

export const PAGE_SIZE = 30;
// Cap deep pagination to keep OFFSET-based paging cheap — past this,
// further "load more" clicks stop rather than scanning ever-deeper offsets.
const MAX_PAGES = 10;

export interface RankedSearchRow {
  id: string;
  provider: string;
  kind: string;
  integrationId: string;
  accountEmail: string | null;
  title: string;
  participants: string;
  snippet: string | null;
  bodyText: string | null;
  url: string | null;
  updatedAt: Date;
  metadata: unknown;
  rank: number;
}

function buildPrefixTsQuery(keyword: string): string {
  const terms = keyword.split(/\s+/).filter(Boolean);
  return terms
    .map((term, i) => (i === terms.length - 1 ? `${term}:*` : term))
    .join(" & ");
}

export async function searchItems(
  userId: string,
  rawKeyword: string,
  page: number,
  provider?: string,
): Promise<{ rows: RankedSearchRow[]; hasMore: boolean }> {
  const keyword = rawKeyword.trim();
  if (!keyword || page < 0 || page >= MAX_PAGES)
    return { rows: [], hasMore: false };

  const offset = page * PAGE_SIZE;
  const tsQuery = buildPrefixTsQuery(keyword);
  const substring = `%${keyword}%`;
  const prefix = `${keyword}%`;
  const providerClause = provider ? sql`AND si.provider = ${provider}` : sql``;

  // Fetch one extra row to cheaply determine hasMore without a second COUNT query.

  const db = getDb();
  const result = await db.execute(sql`
  SELECT
    si.id, si.provider, si.kind, si."integrationId",
    i."accountEmail",
    si.title, si.participants, si.snippet, si."bodyText", si.url,
    si."updatedAt", si.metadata,
    CASE
      WHEN lower(si.title) = lower(${keyword}) THEN 100
      WHEN lower(si.participants) = lower(${keyword}) THEN 95
      WHEN si.title ILIKE ${prefix} THEN 90
      WHEN si.participants ILIKE ${prefix} THEN 85
      WHEN si.title ILIKE ${substring} THEN 70
      WHEN si.participants ILIKE ${substring} THEN 65
      WHEN si."searchVector" @@ to_tsquery('english', ${tsQuery}) THEN 50
      WHEN ${keyword} <% si.title OR ${keyword} <% si.participants THEN 30
      ELSE 0
    END
    + (extract(epoch FROM si."updatedAt") / 1e13) AS rank
  FROM "SearchItem" si
  JOIN "Integration" i ON i.id = si."integrationId"
  WHERE si."userId" = ${userId}
    AND (
      si.title ILIKE ${substring}
      OR si.participants ILIKE ${substring}
      OR si."searchVector" @@ to_tsquery('english', ${tsQuery})
      OR ${keyword} <% si.title
      OR ${keyword} <% si.participants
    )
    ${providerClause}
  ORDER BY rank DESC, si."updatedAt" DESC
  LIMIT ${PAGE_SIZE + 1} OFFSET ${offset};
  `);

  // The neon-http driver returns raw rows with timestamp/numeric columns as
  // plain strings (unlike Prisma, which auto-cast these) — normalize here so
  // RankedSearchRow's types stay honest for every caller downstream.
  const rawRows = result.rows as unknown as (Omit<
    RankedSearchRow,
    "updatedAt" | "rank"
  > & { updatedAt: string | Date; rank: string | number })[];
  const rows: RankedSearchRow[] = rawRows.map((row) => ({
    ...row,
    updatedAt: new Date(row.updatedAt),
    rank: Number(row.rank),
  }));

  const hasMore = rows.length > PAGE_SIZE && page + 1 < MAX_PAGES;
  return { rows: rows.slice(0, PAGE_SIZE), hasMore };
}
