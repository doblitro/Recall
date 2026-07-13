import {
  buildKeywordRegex,
  highlightKeywordInResult,
} from "@/lib/connectors/highlight";
import { RankedSearchRow } from "./query";

const EXCERPT_CONTEXT_CHARS = 80;

// Synchronous now that bodyText is already local (no second API round-trip
// like the old relocateSnippetFromBody, which had to re-fetch the message).
function buildBodyExcerpt(
  bodyText: string,
  keyword: string,
): string | undefined {
  const regex = buildKeywordRegex(keyword, "i");
  if (!regex) return undefined;

  const match = bodyText.match(regex);
  if (!match || match.index === undefined) return undefined;

  const start = Math.max(0, match.index - EXCERPT_CONTEXT_CHARS);
  const end = Math.min(
    bodyText.length,
    match.index + match[0].length + EXCERPT_CONTEXT_CHARS,
  );
  return highlightKeywordInResult(bodyText.slice(start, end).trim(), keyword);
}

export interface SearchResultPayload {
  id: string;
  provider: string;
  kind: string;
  integrationId: string;
  accountEmail: string | null;
  title: string;
  subtitle?: string;
  preview?: string;
  url: string | null;
  updatedAt: string;
  metadata: unknown;
}

export function buildResultPayload(
  row: RankedSearchRow,
  keyword: string,
): SearchResultPayload {
  const preview = row.snippet
    ? highlightKeywordInResult(row.snippet, keyword)
    : row.bodyText
      ? buildBodyExcerpt(row.bodyText, keyword)
      : undefined;

  return {
    id: row.id,
    provider: row.provider,
    kind: row.kind,
    integrationId: row.integrationId,
    accountEmail: row.accountEmail,
    title: highlightKeywordInResult(row.title, keyword) ?? row.title,
    subtitle: highlightKeywordInResult(row.participants, keyword),
    preview,
    url: row.url,
    updatedAt: row.updatedAt.toISOString(),
    metadata: row.metadata,
  };
}
