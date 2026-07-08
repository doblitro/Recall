import type { ConnectorProvider } from "../types";
import { GMAIL_PROVIDER_ID } from "../public";
import {
  buildGoogleAuthUrl,
  exchangeGoogleAuthCode,
  refreshGoogleAccessToken,
  fetchGoogleUserProfile,
  revokeGoogleToken,
} from "../google-oauth-client";

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
    return buildGoogleAuthUrl(GMAIL_PROVIDER_ID, this.scopes, state);
  },

  async exchangeCodeForTokens(code) {
    const tokens = await exchangeGoogleAuthCode(GMAIL_PROVIDER_ID, code);
    const profile = await fetchGoogleUserProfile(tokens.access_token);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
      providerAccountId: profile.id ?? "",
      accountEmail: profile.email ?? undefined,
      accountName: profile.name ?? undefined,
      accountAvatar: profile.picture ?? undefined,
    };
  },

  async refreshAccessToken(refreshToken) {
    const tokens = await refreshGoogleAccessToken(refreshToken);

    return {
      accessToken: tokens.access_token,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    };
  },

  async revoke(accessToken) {
    await revokeGoogleToken(accessToken);
  },
};
