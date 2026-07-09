import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import { createSearchRoute } from "@/lib/connectors/search-route";
import { buildKeywordRegex, highlightKeywordInResult } from "@/lib/connectors/highlight";
import { parseParticipants } from "@/lib/connectors/participants";
import { decodePartText, extractTextFromPart } from "@/lib/connectors/gmail-body";
import { GmailListItem, GmailListMetadata } from "@/lib/connectors/types";

const METADATA_HEADERS = [
  "Subject",
  "From",
  "To",
  "Cc",
  "Bcc",
  "Date",
  "Message-ID",
  "Reply-To",
];

export async function gmailFetch(
  accessToken: string,
  path: string,
  params: [string, string][] = [],
) {
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me${path}`);
  for (const [key, value] of params) url.searchParams.append(key, value);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = null;
    }
  }

  if (!response.ok) {
    const body = data ?? text;
    throw new Error(
      `Gmail API error: ${typeof body === "string" ? body : JSON.stringify(body)}`,
    );
  }

  return data;
}

function headersMap(data: any): Map<string, string> {
  return new Map<string, string>(
    (data.payload?.headers ?? []).map((h: { name: string; value: string }) => [
      h.name,
      h.value,
    ]),
  );
}

function buildMetadata(
  headers: Map<string, string>,
  data: any,
  keyword: string,
  matchedInBody: boolean,
): GmailListMetadata {
  return {
    threadId: data.threadId,
    messageId: headers.get("Message-ID"),
    from: parseParticipants(headers.get("From")),
    to: parseParticipants(headers.get("To")),
    cc: parseParticipants(headers.get("Cc")),
    bcc: parseParticipants(headers.get("Bcc")),
    replyTo: parseParticipants(headers.get("Reply-To")),
    toDisplay: highlightKeywordInResult(headers.get("To"), keyword),
    ccDisplay: highlightKeywordInResult(headers.get("Cc"), keyword),
    bccDisplay: highlightKeywordInResult(headers.get("Bcc"), keyword),
    replyToDisplay: highlightKeywordInResult(headers.get("Reply-To"), keyword),
    matchedInBody,
  };
}

async function relocateSnippetFromBody(
  accessToken: string,
  messageId: string,
  keyword: string,
  fallbackSnippet: string,
): Promise<string | undefined> {
  const regex = buildKeywordRegex(keyword, "i");
  if (!regex) return highlightKeywordInResult(fallbackSnippet, keyword);

  const data = await gmailFetch(accessToken, `/messages/${messageId}`, [
    ["format", "full"],
  ]);

  const texts: string[] = [];
  if (data.payload?.body?.data)
    texts.push(decodePartText(data.payload, data.payload.body.data));
  texts.push(...extractTextFromPart(data.payload));

  for (const txt of texts) {
    const m = txt.match(regex);
    if (m && m.index !== undefined) {
      const idx = m.index;
      const context = 80;
      const start = Math.max(0, idx - context);
      const end = Math.min(txt.length, idx + m[0].length + context);
      const snippet = txt.slice(start, end).trim();
      return highlightKeywordInResult(snippet, keyword);
    }
  }

  return highlightKeywordInResult(fallbackSnippet, keyword);
}

async function searchGmailMessages(
  accessToken: string,
  keyword: string,
): Promise<GmailListItem[]> {
  const listData = await gmailFetch(accessToken, "/messages", [
    ["q", keyword],
    ["maxResults", "20"],
    ["fields", "messages(id, threadId)"],
  ]);

  const messages: { id: string; threadId?: string }[] = listData?.messages ?? [];

  return Promise.all(
    messages.map(async (message): Promise<GmailListItem> => {
      const params: [string, string][] = [["format", "metadata"]];
      for (const header of METADATA_HEADERS) params.push(["metadataHeaders", header]);

      const data = await gmailFetch(accessToken, `/messages/${message.id}`, params);
      const headers = headersMap(data);

      const regex = buildKeywordRegex(keyword, "i");
      const candidates = [
        data.snippet ?? "",
        headers.get("Subject") ?? "",
        headers.get("From") ?? "",
        headers.get("To") ?? "",
        headers.get("Cc") ?? "",
        headers.get("Bcc") ?? "",
      ];
      const matchedInHeaders = regex ? candidates.some((c) => regex.test(c)) : false;

      const matchedInBody = !matchedInHeaders;
      const preview = matchedInHeaders
        ? highlightKeywordInResult(data.snippet ?? "", keyword)
        : await relocateSnippetFromBody(
            accessToken,
            data.id,
            keyword,
            data.snippet ?? "",
          );

      return {
        id: data.id,
        provider: GMAIL_PROVIDER_ID,
        integrationId: "",
        accountEmail: "",
        title: highlightKeywordInResult(
          headers.get("Subject") || "(no subject)",
          keyword,
        ) as string,
        subtitle: highlightKeywordInResult(headers.get("From"), keyword),
        preview,
        url: data.threadId
          ? `https://mail.google.com/mail/u/0/#all/${data.threadId}`
          : undefined,
        updatedAt: data.internalDate
          ? new Date(Number(data.internalDate)).toISOString()
          : headers.get("Date"),
        metadata: buildMetadata(headers, data, keyword, matchedInBody),
      };
    }),
  );
}

export const GET = createSearchRoute({
  providerId: GMAIL_PROVIDER_ID,
  itemsKey: "messages",
  notConnectedMessage: "Gmail is not connected",
  search: searchGmailMessages,
});
