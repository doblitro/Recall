import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getValidAccessToken } from "@/lib/connectors/token";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.error("No logged in user.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?session_error=missing" },
    });
  }

  if (!session.user?.email) {
    console.error("Session missing user email.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?session_error=missing_email" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    console.error("User does not exist.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?session_error=missing_user" },
    });
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(user.id, GOOGLE_DRIVE_PROVIDER_ID);
  } catch (err: any) {
    console.error("Google Drive is not connected:", err.message);
    return NextResponse.json(
      { error: "Google Drive is not connected" },
      { status: 403 },
    );
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
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 4. Sanitize the string to prevent breaks if users type single quotes
    const sanitizedKeyword = keyword.replace(/'/g, "\\'");

    // 5. Query Google Drive using the SQL-like filter string
    const response = await drive.files.list({
      // Filters for filenames containing the keyword AND ignores deleted/trashed files
      q: `name contains '${sanitizedKeyword}' and trashed = false`,
      pageSize: 20,
      fields:
        "files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime, owners)",
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
