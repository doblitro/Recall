import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import { fetchWithRateLimitRetry } from "@/lib/connectors/google-oauth-client";
import { GoogleAuthRequiredError } from "@/lib/connectors/errors";

export async function driveFetch<T = unknown>(
  accessToken: string,
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`https://www.googleapis.com/drive/v3${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetchWithRateLimitRetry(GOOGLE_DRIVE_PROVIDER_ID, () =>
    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } }),
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
    throw new GoogleAuthRequiredError(GOOGLE_DRIVE_PROVIDER_ID);
  }

  if (!response.ok) {
    throw new Error(`Drive API error: status ${response.status}`);
  }

  return (data ?? {}) as T;
}
