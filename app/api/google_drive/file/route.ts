import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const isDriveConnected = !!cookieStore.get("drive_access_token")?.value;

  if (!isDriveConnected) {
    return NextResponse.json(
      { error: "Google Drive is not connected" },
      { status: 403 },
    );
  }

  const accessToken = cookieStore.get("drive_access_token")?.value;
  const refreshToken = cookieStore.get("drive_refresh_token")?.value;
  const isExpired = cookieStore.get("drive_token_expiry")?.value;

  // Initialize OAuth2 client early so it can be used for refresh if needed
  const oauth2Client = new google.auth.OAuth2();

  if (accessToken) {
    oauth2Client.setCredentials({ access_token: accessToken });
  }

  if (isExpired && new Date(isExpired) < new Date()) {
    oauth2Client.refreshAccessToken().then((response) => {
      const newAccessToken = response.credentials.access_token;
      const newExpiryDate = response.credentials.expiry_date;

      if (newAccessToken && newExpiryDate) {
        // Update cookies with the new access token and expiry date
        cookieStore.set("drive_access_token", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          expires: new Date(newExpiryDate),
        });
      }
    });
  }

  // 2. Extract the keyword parameter from the URL string
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is required" },
      { status: 400 },
    );
  }

  try {
    // 3. Initialize Google API Client
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 4. Sanitize the string to prevent breaks if users type single quotes
    const sanitizedKeyword = keyword.replace(/'/g, "\\'");

    // 5. Query Google Drive using the SQL-like filter string
    const response = await drive.files.list({
      // Filters for filenames containing the keyword AND ignores deleted/trashed files
      q: `name contains '${sanitizedKeyword}' and trashed = false`,
      pageSize: 20,
      fields:
        "files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime)",
    });

    return NextResponse.json({ files: response.data.files });
  } catch (error: any) {
    console.error("Search Error:", error);
    return NextResponse.json(
      { error: "Failed to search files" },
      { status: 500 },
    );
  }
}
