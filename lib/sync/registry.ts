import { gmailSyncAdapter } from "./gmail-sync";
import { SyncAdapter } from "./types";

export const syncAdaptersArray: SyncAdapter[] = [gmailSyncAdapter];

export const syncAdaptersRecord: Record<string, SyncAdapter> =
  syncAdaptersArray.reduce(
    (acc, adapter) => {
      acc[adapter.providerId] = adapter;
      return acc;
    },
    {} as Record<string, SyncAdapter>,
  );

export function getSyncAdapter(providerId: string): SyncAdapter | undefined {
  return syncAdaptersRecord[providerId];
}
