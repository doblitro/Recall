import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import { createSearchRoute } from "@/lib/connectors/search-route";
import { highlightKeywordInResult } from "@/lib/connectors/highlight";
import {
  formatParticipant,
  toParticipant,
} from "@/lib/connectors/participants";
import { DriveListItem } from "@/lib/connectors/types";
import { GoogleAuthRequiredError } from "@/lib/connectors/errors";
import { fetchWithRateLimitRetry } from "@/lib/connectors/google-oauth-client";

interface DriveApiFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  owners?: { displayName?: string; emailAddress: string }[];
}

interface DriveApiFileList {
  files?: DriveApiFile[];
}

async function searchDriveFiles(
  accessToken: string,
  keyword: string,
): Promise<DriveListItem[]> {
  const sanitizedKeyword = keyword.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const q = `name contains '${sanitizedKeyword}' and trashed = false`;

  const params = new URLSearchParams({
    q,
    pageSize: "20",
    fields:
      "files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime, owners)",
  });

  const response = await fetchWithRateLimitRetry(GOOGLE_DRIVE_PROVIDER_ID, () =>
    fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  const text = await response.text();
  let data: DriveApiFileList | null = null;
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

  data ??= {};

  const files = data.files ?? [];

  return files.map((file) => {
    const owners = (file.owners ?? []).map(toParticipant);

    return {
      id: file.id,
      provider: GOOGLE_DRIVE_PROVIDER_ID,
      integrationId: "",
      accountEmail: "",
      title: highlightKeywordInResult(file.name, keyword) ?? file.name,
      subtitle: owners[0] ? formatParticipant(owners[0]) : undefined,
      preview: undefined,
      url: file.webViewLink,
      updatedAt: file.modifiedTime,
      metadata: {
        mimeType: file.mimeType,
        thumbnailLink: file.thumbnailLink,
        owners,
      },
    };
  });
}

export const GET = createSearchRoute({
  providerId: GOOGLE_DRIVE_PROVIDER_ID,
  itemsKey: "files",
  notConnectedMessage: "Google Drive is not connected",
  search: searchDriveFiles,
});
