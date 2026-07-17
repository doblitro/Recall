import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import { gmailFetch, GmailMessage } from "@/lib/connectors/gmail-client";
import { extractTextFromPart } from "@/lib/connectors/gmail-body";
import {
  parseParticipants,
  formatParticipant,
} from "@/lib/connectors/participants";
import { SearchItemKind } from "@/lib/db/schema";
import { upsertSearchItems, deleteSearchItems } from "./upsert";
import { SyncAdapter, SyncContext, SyncResult, SearchItemInput } from "./types";
import { mapWithConcurrency } from "./concurrency";

const FETCH_CONCURRENCY = 10;

const BODY_TEXT_MAX_CHARS = 20_000;
const LIST_PAGE_SIZE = 100;

interface GmailMessageListResponse {
  messages?: { id: string }[];
  nextPageToken?: string;
  historyId?: string;
}

interface GmailProfile {
  historyId?: string;
}

interface GmailHistoryRecord {
  messagesAdded?: { message: { id: string } }[];
  messagesDeleted?: { message: { id: string } }[];
}

interface GmailHistoryListResponse {
  history?: GmailHistoryRecord[];
  historyId?: string;
  nextPageToken?: string;
}

function headersMap(message: GmailMessage): Map<string, string> {
  return new Map<string, string>(
    (message.payload?.headers ?? []).map((h) => [h.name, h.value]),
  );
}

function buildParticipants(headers: Map<string, string>): string {
  const groups = [
    headers.get("From"),
    headers.get("To"),
    headers.get("Cc"),
    headers.get("Bcc"),
  ];
  return groups
    .flatMap((raw) => parseParticipants(raw).map(formatParticipant))
    .join(", ");
}

async function fetchAndMapMessage(
  accessToken: string,
  messageId: string,
): Promise<SearchItemInput> {
  const message = await gmailFetch<GmailMessage>(
    accessToken,
    `/messages/${messageId}`,
    [["format", "full"]],
  );
  const headers = headersMap(message);
  const bodyText = extractTextFromPart(message.payload)
    .join("\n\n")
    .slice(0, BODY_TEXT_MAX_CHARS);

  return {
    externalId: message.id,
    kind: SearchItemKind.gmail_message,
    title: headers.get("Subject") || "(no subject)",
    participants: buildParticipants(headers),
    snippet: message.snippet,
    bodyText: bodyText || undefined,
    url: message.threadId
      ? `https://mail.google.com/mail/u/0/#all/${message.threadId}`
      : undefined,
    updatedAt: message.internalDate
      ? new Date(Number(message.internalDate))
      : new Date(),
    metadata: {
      threadId: message.threadId,
      from: parseParticipants(headers.get("From")),
      to: parseParticipants(headers.get("To")),
      cc: parseParticipants(headers.get("Cc")),
      bcc: parseParticipants(headers.get("Bcc")),
    },
  };
}

async function fetchAndUpsertMessages(
  ctx: SyncContext,
  messageIds: string[],
): Promise<number> {
  if (messageIds.length === 0) return 0;

  const items = await mapWithConcurrency(messageIds, FETCH_CONCURRENCY, (id) =>
    fetchAndMapMessage(ctx.accessToken, id),
  );
  return upsertSearchItems(
    ctx.userId,
    ctx.integrationId,
    GMAIL_PROVIDER_ID,
    items,
  );
}

async function fullSync(ctx: SyncContext): Promise<SyncResult> {
  const messageIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const params: [string, string][] = [
      ["maxResults", String(LIST_PAGE_SIZE)],
      ["fields", "messages(id), nextPageToken"],
    ];
    if (pageToken) params.push(["pageToken", pageToken]);

    const listData = await gmailFetch<GmailMessageListResponse>(
      ctx.accessToken,
      "/messages",
      params,
    );
    messageIds.push(...(listData?.messages ?? []).map((m) => m.id));
    pageToken = listData?.nextPageToken;
  } while (pageToken);

  const upserted = await fetchAndUpsertMessages(ctx, messageIds);

  const profile = await gmailFetch<GmailProfile>(ctx.accessToken, "/profile");

  return {
    upserted,
    deleted: 0,
    cursor: profile.historyId ?? null,
    fullResync: true,
  };
}

async function incrementalSync(ctx: SyncContext): Promise<SyncResult> {
  if (!ctx.previousCursor) return fullSync(ctx);

  const addedIds = new Set<string>();
  const deletedIds = new Set<string>();
  let pageToken: string | undefined;
  let latestHistoryId = ctx.previousCursor;

  try {
    do {
      const params: [string, string][] = [
        ["startHistoryId", ctx.previousCursor],
        ["historyTypes", "messageAdded"],
        ["historyTypes", "messageDeleted"],
      ];
      if (pageToken) params.push(["pageToken", pageToken]);

      const historyData = await gmailFetch<GmailHistoryListResponse>(
        ctx.accessToken,
        "/history",
        params,
      );

      for (const record of historyData?.history ?? []) {
        for (const added of record.messagesAdded ?? []) {
          addedIds.add(added.message.id);
        }
        for (const deleted of record.messagesDeleted ?? []) {
          deletedIds.add(deleted.message.id);
          addedIds.delete(deleted.message.id);
        }
      }

      if (historyData?.historyId) latestHistoryId = historyData.historyId;
      pageToken = historyData?.nextPageToken;
    } while (pageToken);
  } catch (error) {
    // Gmail retains history for ~1 week; a 404 here means the cursor
    // expired and we must fall back to a full rescan.
    if (error instanceof Error && error.message.includes("404")) {
      return fullSync(ctx);
    }
    throw error;
  }

  const deleted = await deleteSearchItems(ctx.integrationId, [...deletedIds]);
  const upserted = await fetchAndUpsertMessages(ctx, [...addedIds]);

  return {
    upserted,
    deleted,
    cursor: latestHistoryId,
    fullResync: false,
  };
}

export const gmailSyncAdapter: SyncAdapter = {
  providerId: GMAIL_PROVIDER_ID,
  kind: SearchItemKind.gmail_message,
  fullSync,
  incrementalSync,
};
