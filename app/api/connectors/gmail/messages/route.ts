import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import { createSearchRoute } from "@/lib/connectors/search-route";

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

async function searchGmailMessages(accessToken: string, keyword: string) {
  const listData = await gmailFetch(accessToken, "/messages", [
    ["q", keyword],
    ["maxResults", "20"],
    ["fields", "messages(id, threadId)"],
  ]);

  const messages: { id: string }[] = listData.messages ?? [];

  return Promise.all(
    messages.map(async (message) => {
      const data = await gmailFetch(accessToken, `/messages/${message.id}`, [
        ["format", "metadata"],
        ["metadataHeaders", "Subject"],
        ["metadataHeaders", "From"],
        ["metadataHeaders", "Date"],
      ]);

      const headers = new Map<string, string>(
        (data.payload?.headers ?? []).map(
          (h: { name: string; value: string }) => [h.name, h.value],
        ),
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
