import { SearchItemKind } from "@/lib/db/schema";

export interface SearchItemInput {
  externalId: string;
  kind: SearchItemKind;
  title: string;
  participants: string;
  snippet?: string;
  bodyText?: string;
  url?: string;
  updatedAt: Date;
  metadata: unknown;
}

export interface SyncResult {
  upserted: number;
  deleted: number;
  /** Provider-native cursor to persist (Gmail historyId / Drive startPageToken). */
  cursor: string | null;
  /** True if this run had to fall back to a full rescan (e.g. expired cursor). */
  fullResync: boolean;
}

export interface SyncContext {
  userId: string;
  integrationId: string;
  /** Already refreshed via getValidAccessToken. */
  accessToken: string;
  previousCursor: string | null;
}

export interface SyncAdapter {
  providerId: string;
  kind: SearchItemKind;

  /** First sync (no cursor yet), or fallback when the cursor is stale/invalid. */
  fullSync(ctx: SyncContext): Promise<SyncResult>;

  /** Incremental sync using the provider-native cursor mechanism. */
  incrementalSync(ctx: SyncContext): Promise<SyncResult>;
}
