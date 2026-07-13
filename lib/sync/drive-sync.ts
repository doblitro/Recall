import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import { driveFetch } from "@/lib/connectors/drive-client";
import { fetchWithRateLimitRetry } from "@/lib/connectors/google-oauth-client";
import {
  formatParticipant,
  toParticipant,
} from "@/lib/connectors/participants";
import { SearchItemKind } from "@/app/generated/prisma/enums";
import { upsertSearchItems, deleteSearchItems } from "./upsert";
import { SyncAdapter, SyncContext, SyncResult, SearchItemInput } from "./types";

const BODY_TEXT_MAX_CHARS = 20_000;
const LIST_PAGE_SIZE = "100";

// Drive only lets us export plain/csv text for its own native doc types —
// there's no generic text-extraction endpoint for arbitrary binary files
// (PDFs, images, etc.), so those get `bodyText: undefined`.
const GOOGLE_NATIVE_EXPORT_MIME: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
};

interface DriveApiFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  owners?: { displayName?: string; emailAddress: string }[];
  trashed?: boolean;
}

interface DriveApiFileList {
  files?: DriveApiFile[];
  nextPageToken?: string;
}

interface DriveStartPageTokenResponse {
  startPageToken?: string;
}

interface DriveChange {
  fileId: string;
  removed?: boolean;
  file?: DriveApiFile;
}

interface DriveChangesListResponse {
  changes?: DriveChange[];
  nextPageToken?: string;
  newStartPageToken?: string;
}

async function fetchExportedText(
  accessToken: string,
  fileId: string,
  exportMimeType: string,
): Promise<string | undefined> {
  try {
    const response = await fetchWithRateLimitRetry(
      GOOGLE_DRIVE_PROVIDER_ID,
      () =>
        fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
    );
    if (!response.ok) return undefined;
    return await response.text();
  } catch {
    return undefined;
  }
}

async function mapDriveFile(
  accessToken: string,
  file: DriveApiFile,
): Promise<SearchItemInput> {
  const owners = (file.owners ?? []).map(toParticipant);
  const exportMimeType = GOOGLE_NATIVE_EXPORT_MIME[file.mimeType];
  const exportedText = exportMimeType
    ? await fetchExportedText(accessToken, file.id, exportMimeType)
    : undefined;

  return {
    externalId: file.id,
    kind: SearchItemKind.drive_file,
    title: file.name,
    participants: owners.map(formatParticipant).join(", "),
    bodyText: exportedText?.slice(0, BODY_TEXT_MAX_CHARS),
    url: file.webViewLink,
    updatedAt: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
    metadata: {
      mimeType: file.mimeType,
      thumbnailLink: file.thumbnailLink,
      owners,
    },
  };
}

async function fullSync(ctx: SyncContext): Promise<SyncResult> {
  const files: DriveApiFile[] = [];
  let pageToken: string | undefined;

  do {
    const data = await driveFetch<DriveApiFileList>(ctx.accessToken, "/files", {
      q: "trashed = false",
      pageSize: LIST_PAGE_SIZE,
      fields:
        "files(id,name,mimeType,webViewLink,thumbnailLink,modifiedTime,owners),nextPageToken",
      ...(pageToken ? { pageToken } : {}),
    });
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  const items = await Promise.all(
    files.map((file) => mapDriveFile(ctx.accessToken, file)),
  );
  const upserted = await upsertSearchItems(
    ctx.userId,
    ctx.integrationId,
    GOOGLE_DRIVE_PROVIDER_ID,
    items,
  );

  const startToken = await driveFetch<DriveStartPageTokenResponse>(
    ctx.accessToken,
    "/changes/startPageToken",
  );

  return {
    upserted,
    deleted: 0,
    cursor: startToken.startPageToken ?? null,
    fullResync: true,
  };
}

async function incrementalSync(ctx: SyncContext): Promise<SyncResult> {
  if (!ctx.previousCursor) return fullSync(ctx);

  const upsertItems: SearchItemInput[] = [];
  const deletedIds: string[] = [];
  let pageToken: string | undefined = ctx.previousCursor;
  let newStartPageToken: string | null = null;

  try {
    do {
      const data: DriveChangesListResponse =
        await driveFetch<DriveChangesListResponse>(
          ctx.accessToken,
          "/changes",
          {
            pageToken,
            fields:
              "changes(fileId,removed,file(id,name,mimeType,webViewLink,thumbnailLink,modifiedTime,owners,trashed)),nextPageToken,newStartPageToken",
          },
        );

      for (const change of data.changes ?? []) {
        if (change.removed || change.file?.trashed) {
          deletedIds.push(change.fileId);
        } else if (change.file) {
          upsertItems.push(await mapDriveFile(ctx.accessToken, change.file));
        }
      }

      if (data.newStartPageToken) newStartPageToken = data.newStartPageToken;
      pageToken = data.nextPageToken;
    } while (pageToken);
  } catch (error) {
    // A 410 means the page token expired — fall back to a full rescan.
    if (error instanceof Error && error.message.includes("410")) {
      return fullSync(ctx);
    }
    throw error;
  }

  const deleted = await deleteSearchItems(ctx.integrationId, deletedIds);
  const upserted = await upsertSearchItems(
    ctx.userId,
    ctx.integrationId,
    GOOGLE_DRIVE_PROVIDER_ID,
    upsertItems,
  );

  return {
    upserted,
    deleted,
    cursor: newStartPageToken ?? ctx.previousCursor,
    fullResync: false,
  };
}

export const driveSyncAdapter: SyncAdapter = {
  providerId: GOOGLE_DRIVE_PROVIDER_ID,
  kind: SearchItemKind.drive_file,
  fullSync,
  incrementalSync,
};
