import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import { createSearchRoute } from "@/lib/connectors/search-route";
import { GmailAttachment, GmailMessage } from "@/lib/connectors/types";

async function gmailFetch(
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

function extractAttachments(part: any): GmailAttachment[] {
  const results: GmailAttachment[] = [];
  if (part?.filename) {
    results.push({ filename: part.filename, mimeType: part.mimeType });
  }
  for (const child of part?.parts ?? []) {
    results.push(...extractAttachments(child));
  }
  return results;
}

async function searchGmailMessages(accessToken: string, keyword: string) {
  const listData = await gmailFetch(accessToken, "/messages", [
    ["q", keyword],
    ["maxResults", "20"],
    ["fields", "messages(id, threadId)"],
  ]);

  const messages: GmailMessage[] = listData?.messages ?? [];

  return Promise.all(
    messages.map(async (message: GmailMessage) => {
      const data = await gmailFetch(accessToken, `/messages/${message.id}`, [
        ["format", "full"],
      ]);

      const headers = new Map<string, string>(
        (data.payload?.headers ?? []).map(
          (h: { name: string; value: string }) => [h.name, h.value],
        ),
      );

      return {
        id: data.id,
        snippet: getSnippetFromPayload(data, keyword),
        subject: highlightKeywordInResult(
          headers.get("Subject") ?? undefined,
          keyword,
        ),
        from: highlightKeywordInResult(headers.get("From") ?? undefined, keyword),
        to: highlightKeywordInResult(headers.get("To") ?? undefined, keyword),
        date: headers.get("Date") ?? undefined,
        attachments: extractAttachments(data.payload).map((attachment) => ({
          ...attachment,
          filename: highlightKeywordInResult(attachment.filename, keyword) ?? "",
        })),
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

function base64UrlDecode(data: string) {
  // Gmail uses base64url: replace URL-safe characters then pad
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const str = b64 + pad;
  try {
    return Buffer.from(str, "base64").toString("utf8");
  } catch (e) {
    return "";
  }
}

function decodeQuotedPrintable(input: string): string {
  const stripped = input.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < stripped.length; i++) {
    const hex = stripped.slice(i + 1, i + 3);
    if (stripped[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(stripped.charCodeAt(i));
    }
  }
  return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

function isQuotedPrintable(part: any): boolean {
  const header = (part?.headers ?? []).find(
    (h: { name: string; value: string }) =>
      h.name?.toLowerCase() === "content-transfer-encoding",
  );
  return header?.value?.trim().toLowerCase() === "quoted-printable";
}

function decodePartText(part: any, data: string): string {
  const decoded = base64UrlDecode(data);
  return isQuotedPrintable(part) ? decodeQuotedPrintable(decoded) : decoded;
}

function extractTextFromPart(part: any): string[] {
  const results: string[] = [];
  if (!part) return results;
  if (part.mimeType === "text/plain" && part.body?.data) {
    results.push(decodePartText(part, part.body.data));
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    // crude HTML -> text
    const html = decodePartText(part, part.body.data);
    results.push(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  }
  for (const child of part.parts ?? []) {
    results.push(...extractTextFromPart(child));
  }
  return results;
}

function getSnippetFromPayload(data: any, keyword: string) {
  const original = data?.snippet ?? "";
  const regex = buildKeywordRegex(keyword, "i");
  if (!regex) return highlightKeywordInResult(original, keyword);

  // If original snippet already contains a keyword term, just highlight it
  if (regex.test(original)) return highlightKeywordInResult(original, keyword);

  // Otherwise, search message payload parts for the keyword
  const texts: string[] = [];
  if (data?.payload) {
    // payload itself can have body.data
    if (data.payload.body?.data)
      texts.push(decodePartText(data.payload, data.payload.body.data));
    texts.push(...extractTextFromPart(data.payload));
  }

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

  // fallback to original snippet (highlight if possible)
  return highlightKeywordInResult(original, keyword);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Builds a regex matching any individual whitespace-separated term in `keyword`,
// since Gmail's search ANDs terms that don't need to be adjacent in the text.
function buildKeywordRegex(keyword: string, flags: string) {
  const terms = keyword
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (terms.length === 0) return null;
  return new RegExp(`(${terms.join("|")})`, flags);
}

const highlightKeywordInResult = (
  result: string | undefined,
  keyword: string,
) => {
  if (!result) return result;

  const escaped = escapeHtml(result);
  const regex = buildKeywordRegex(keyword, "gi");
  if (!regex) return escaped;

  return escaped.replace(regex, (match) => `<mark>${match}</mark>`);
};
