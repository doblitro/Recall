import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import { createSearchRoute } from "@/lib/connectors/search-route";
import type { DriveFile } from "@/app/components/drive/DriveFiles";

async function searchDriveFiles(accessToken: string, keyword: string) {
  const sanitizedKeyword = keyword.replace(/'/g, "\\'");
  const q = `name contains '${sanitizedKeyword}' and trashed = false`;

  const params = new URLSearchParams({
    q,
    pageSize: "20",
    fields:
      "files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime, owners)",
  });

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Drive API error: ${JSON.stringify(data)}`);
  }

  return (data.files ?? []) as DriveFile[];
}

export const GET = createSearchRoute({
  providerId: GOOGLE_DRIVE_PROVIDER_ID,
  itemsKey: "files",
  notConnectedMessage: "Google Drive is not connected",
  search: searchDriveFiles,
});
