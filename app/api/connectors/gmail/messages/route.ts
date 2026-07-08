import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import { createSearchRoute } from "@/lib/connectors/search-route";
import { OAuth2Client } from "google-auth-library";
import { gmail } from "@googleapis/gmail";

async function searchGmailMessages(accessToken: string, keyword: string) {
  const oauth2Client = new OAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmailClient = gmail({ version: "v1", auth: oauth2Client });

  const response = await gmailClient.users.messages.list({
    userId: "me",
    q: keyword,
    maxResults: 20,
    fields: "messages(id, threadId)",
  });

  const messages = response.data.messages ?? [];

  return Promise.all(
    messages.map(async (message) => {
      const { data } = await gmailClient.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });

      const headers = new Map(
        (data.payload?.headers ?? []).map((h) => [h.name, h.value]),
      );

      return {
        id: data.id,
        snippet: data.snippet,
        subject: headers.get("Subject") ?? undefined,
        from: headers.get("From") ?? undefined,
        date: headers.get("Date") ?? undefined,
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
