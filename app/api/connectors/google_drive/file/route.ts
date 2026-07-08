import { OAuth2Client } from "google-auth-library";
import { drive } from "@googleapis/drive";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import { createSearchRoute } from "@/lib/connectors/search-route";

async function searchDriveFiles(accessToken: string, keyword: string) {
  const oauth2Client = new OAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const driveClient = drive({ version: "v3", auth: oauth2Client });

  const sanitizedKeyword = keyword.replace(/'/g, "\\'");
  const q = `name contains '${sanitizedKeyword}' and trashed = false`;

  const response = await driveClient.files.list({
    q,
    pageSize: 20,
    fields:
      "files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime, owners)",
  });

  return response.data.files ?? [];
}

export const GET = createSearchRoute({
  providerId: GOOGLE_DRIVE_PROVIDER_ID,
  itemsKey: "files",
  notConnectedMessage: "Google Drive is not connected",
  search: searchDriveFiles,
});
