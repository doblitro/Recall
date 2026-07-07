export interface ExchangedTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  providerAccountId: string;
  accountEmail?: string;
  accountName?: string;
  accountAvatar?: string;
}

export interface RefreshedTokens {
  accessToken: string;
  expiresAt: Date | null;
}

export interface ConnectorProvider {
  id: string;
  label: string;
  scopes: string[];
  requiredEnvVars: string[];
  getAuthUrl(state: string): string;
  exchangeCodeForTokens(code: string): Promise<ExchangedTokens>;
  refreshAccessToken(refreshToken: string): Promise<RefreshedTokens>;
  revoke(accessToken: string): Promise<void>;
}
