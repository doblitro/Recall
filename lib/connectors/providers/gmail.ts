import type { ConnectorProvider } from "../types";
import { GMAIL_PROVIDER_ID } from "../public";
import {
  createGoogleOAuthClient,
  fetchGoogleUserProfile,
} from "../google-oauth-client";

function client() {
  return createGoogleOAuthClient(GMAIL_PROVIDER_ID);
}

export const gmailProvider: ConnectorProvider = {
  id: GMAIL_PROVIDER_ID,
  label: "Gmail",
  scopes: [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
  ],
  requiredEnvVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_URL"],
  getAuthUrl(state) {
    return client().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      state,
      scope: this.scopes,
    });
  },

  async exchangeCodeForTokens(code) {
    const c = client();
    const { tokens } = await c.getToken(code);

    if (!tokens.access_token) {
      throw new Error(
        `Google did not return an access token: ${JSON.stringify(tokens)}`,
      );
    }

    c.setCredentials(tokens);
    const profile = await fetchGoogleUserProfile(c);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      providerAccountId: profile.id ?? "",
      accountEmail: profile.email ?? undefined,
      accountName: profile.name ?? undefined,
      accountAvatar: profile.picture ?? undefined,
    };
  },

  async refreshAccessToken(refreshToken) {
    const c = client();
    c.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await c.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Failed to refresh Gmail access token");
    }

    return {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null,
    };
  },

  async revoke(accessToken) {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to revoke token: ${response.statusText}`);
    }
  },
};
