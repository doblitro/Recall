import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import { createDetailRoute } from "@/lib/connectors/search-route";
import { highlightKeywordInResult } from "@/lib/connectors/highlight";
import {
  formatParticipant,
  toParticipant,
} from "@/lib/connectors/participants";
import { DriveDetailItem } from "@/lib/connectors/types";

async function fetchDriveFileDetail(
  accessToken: string,
  id: string,
  keyword: string,
): Promise<DriveDetailItem> {
  const params = new URLSearchParams({
    fields:
      "id,name,mimeType,webViewLink,thumbnailLink,modifiedTime,owners,description,size,parents,lastModifyingUser",
  });

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${id}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  const file = await response.json();

  if (!response.ok) {
    throw new Error(`Drive API error: ${JSON.stringify(file)}`);
  }

  const owners = (file.owners ?? []).map(toParticipant);

  return {
    id: file.id,
    provider: GOOGLE_DRIVE_PROVIDER_ID,
    integrationId: "",
    accountEmail: "",
    title: highlightKeywordInResult(file.name, keyword) ?? file.name,
    subtitle: owners[0] ? formatParticipant(owners[0]) : undefined,
    preview: file.description,
    url: file.webViewLink,
    updatedAt: file.modifiedTime,
    metadata: {
      mimeType: file.mimeType,
      thumbnailLink: file.thumbnailLink,
      owners,
      description: file.description,
      size: file.size,
      parents: file.parents,
      lastModifyingUser: file.lastModifyingUser
        ? toParticipant(file.lastModifyingUser)
        : undefined,
    },
  };
}

export const GET = createDetailRoute({
  providerId: GOOGLE_DRIVE_PROVIDER_ID,
  itemKey: "file",
  notConnectedMessage: "Google Drive is not connected",
  fetchDetail: fetchDriveFileDetail,
});
