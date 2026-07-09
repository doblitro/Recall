import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import { createDetailRoute } from "@/lib/connectors/search-route";
import { highlightKeywordInResult } from "@/lib/connectors/highlight";
import { parseParticipants } from "@/lib/connectors/participants";
import {
  extractAttachments,
  extractTextFromPart,
} from "@/lib/connectors/gmail-body";
import { GmailDetailItem } from "@/lib/connectors/types";
import { gmailFetch } from "@/app/api/connectors/gmail/messages/route";

async function fetchGmailMessageDetail(
  accessToken: string,
  id: string,
  keyword: string,
): Promise<GmailDetailItem> {
  const data = await gmailFetch(accessToken, `/messages/${id}`, [
    ["format", "full"],
  ]);

  const headers = new Map<string, string>(
    (data.payload?.headers ?? []).map((h: { name: string; value: string }) => [
      h.name,
      h.value,
    ]),
  );

  const texts = extractTextFromPart(data.payload);
  const bodyText = texts.join("\n\n");

  const attachments = extractAttachments(data.payload).map((attachment) => ({
    ...attachment,
    filename: highlightKeywordInResult(attachment.filename, keyword) ?? "",
  }));

  return {
    id: data.id,
    provider: GMAIL_PROVIDER_ID,
    integrationId: "",
    accountEmail: "",
    title: highlightKeywordInResult(
      headers.get("Subject") ?? "(no subject)",
      keyword,
    ) as string,
    subtitle: highlightKeywordInResult(headers.get("From"), keyword),
    preview: highlightKeywordInResult(data.snippet ?? "", keyword),
    url: data.threadId
      ? `https://mail.google.com/mail/u/0/#all/${data.threadId}`
      : undefined,
    updatedAt: data.internalDate
      ? new Date(Number(data.internalDate)).toISOString()
      : headers.get("Date"),
    metadata: {
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
      matchedInBody: false,
      bodyHtml: highlightKeywordInResult(bodyText, keyword) ?? "",
      attachments,
    },
  };
}

export const GET = createDetailRoute({
  providerId: GMAIL_PROVIDER_ID,
  itemKey: "message",
  notConnectedMessage: "Gmail is not connected",
  fetchDetail: fetchGmailMessageDetail,
});
