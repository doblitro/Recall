import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import { createSearchRoute } from "@/lib/connectors/search-route";
import { highlightKeywordInResult } from "@/lib/connectors/highlight";
import { formatParticipant, toParticipant } from "@/lib/connectors/participants";
import { DriveListItem } from "@/lib/connectors/types";

async function searchDriveFiles(
  accessToken: string,
  keyword: string,
): Promise<DriveListItem[]> {
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

  const files: any[] = data.files ?? [];

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
