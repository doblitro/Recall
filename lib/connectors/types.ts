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

export interface Connector {
  id: string;
  label: string;
  image: string;
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

export interface Participant {
  name?: string;
  email: string;
}

// Generic envelope every connector's list and detail results conform to.
// title/subtitle/preview are pre-escaped, pre-highlighted HTML strings — safe
// to render via dangerouslySetInnerHTML.
export interface SearchResult<TMetadata = unknown> {
  id: string;
  provider: string;
  integrationId: string;
  accountEmail: string;
  title: string;
  subtitle?: string;
  preview?: string;
  url?: string;
  updatedAt?: string;
  metadata: TMetadata;
}

// ---- Gmail ----

export type GmailAttachment = { filename: string; mimeType?: string };

export type GmailMessage = { id: string };

export interface GmailParticipants {
  from: Participant[];
  to: Participant[];
  cc: Participant[];
  bcc: Participant[];
  replyTo: Participant[];
}

// Obtainable from a single format=metadata fetch — present on list AND detail results.
export interface GmailListMetadata extends GmailParticipants {
  threadId?: string;
  messageId?: string;
  toDisplay?: string;
  ccDisplay?: string;
  bccDisplay?: string;
  replyToDisplay?: string;
  matchedInBody: boolean;
}

// Only obtainable via format=full — only present on detail results.
export interface GmailDetailMetadata extends GmailListMetadata {
  bodyHtml: string;
  attachments: GmailAttachment[];
}

export type GmailListItem = SearchResult<GmailListMetadata>;
export type GmailDetailItem = SearchResult<GmailDetailMetadata>;

// ---- Google Drive ----

export interface DriveListMetadata {
  mimeType?: string;
  thumbnailLink?: string;
  owners: Participant[];
}

export interface DriveDetailMetadata extends DriveListMetadata {
  description?: string;
  size?: string;
  parents?: string[];
  lastModifyingUser?: Participant;
}

export type DriveListItem = SearchResult<DriveListMetadata>;
export type DriveDetailItem = SearchResult<DriveDetailMetadata>;
