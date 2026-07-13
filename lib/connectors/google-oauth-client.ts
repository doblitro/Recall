import { RateLimitedError } from "./errors";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Retries a fetch once on a 429, honoring Retry-After when present. */
export async function fetchWithRateLimitRetry(
  providerId: string,
  doFetch: () => Promise<Response>,
): Promise<Response> {
  const response = await doFetch();
  if (response.status !== 429) return response;

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 500;
  await new Promise((resolve) =>
    setTimeout(resolve, Number.isFinite(retryAfterMs) ? retryAfterMs : 500),
  );

  const retried = await doFetch();
  if (retried.status === 429) throw new RateLimitedError(providerId);
  return retried;
}

function redirectUriFor(providerId: string) {
  return `${process.env.NEXTAUTH_URL}/api/connectors/${providerId}/callback`;
}

export function buildGoogleAuthUrl(
  providerId: string,
  scopes: string[],
  state: string,
) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUriFor(providerId),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: scopes.join(" "),
    state,
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  id_token?: string;
};

async function requestGoogleToken(body: Record<string, string>) {
  const response = await fetchWithRateLimitRetry("google", () =>
    fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    }),
  );

  const data = (await parseJsonSafely(response)) as
    (GoogleTokenResponse & { error?: string }) | null;

  if (!response.ok || !data?.access_token) {
    const error = new Error(
      `Google token request failed with status ${response.status}`,
    );
    if (data?.error) (error as Error & { code?: string }).code = data.error;
    throw error;
  }

  return data as GoogleTokenResponse;
}

export function exchangeGoogleAuthCode(providerId: string, code: string) {
  return requestGoogleToken({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUriFor(providerId),
  });
}

export function refreshGoogleAccessToken(refreshToken: string) {
  return requestGoogleToken({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
}

export async function fetchGoogleUserProfile(accessToken: string) {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Google user profile: status ${response.status}`,
    );
  }

  return data as {
    id: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

export async function revokeGoogleToken(accessToken: string) {
  const response = await fetch(`${REVOKE_ENDPOINT}?token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!response.ok) {
    throw new Error(`Failed to revoke token: ${response.statusText}`);
  }
}
