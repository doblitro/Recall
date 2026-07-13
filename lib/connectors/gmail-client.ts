import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import { fetchWithRateLimitRetry } from "@/lib/connectors/google-oauth-client";
import { GoogleAuthRequiredError } from "@/lib/connectors/errors";

interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  headers?: GmailHeader[];
  body?: { data?: string };
  mimeType?: string;
  parts?: GmailMessagePart[];
}

export interface GmailMessage {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
}

export async function gmailFetch<T = unknown>(
  accessToken: string,
  path: string,
  params: [string, string][] = [],
): Promise<T> {
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me${path}`);
  for (const [key, value] of params) url.searchParams.append(key, value);

  const response = await fetchWithRateLimitRetry(GMAIL_PROVIDER_ID, () =>
    fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (response.status === 401 || response.status === 403) {
    throw new GoogleAuthRequiredError(GMAIL_PROVIDER_ID);
  }

  if (!response.ok) {
    throw new Error(`Gmail API error: status ${response.status}`);
  }

  return data as T;
}
