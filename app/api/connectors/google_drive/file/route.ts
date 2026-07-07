import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getActiveIntegrations, getValidAccessToken } from "@/lib/connectors/token";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";

async function searchDriveFiles(accessToken: string, q: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const response = await drive.files.list({
    q,
    pageSize: 20,
    fields:
      "files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime, owners)",
  });

  return response.data.files ?? [];
}

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

  // 2. Extract the keyword parameter from the URL string
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");
  const integrationId = searchParams.get("integrationId");

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is required" },
      { status: 400 },
    );
  }

  // 3. Sanitize the string to prevent breaks if users type single quotes
  const sanitizedKeyword = keyword.replace(/'/g, "\\'");
  const q = `name contains '${sanitizedKeyword}' and trashed = false`;

  try {
    const integrations = await getActiveIntegrations(
      user.id,
      GOOGLE_DRIVE_PROVIDER_ID,
    );

    if (integrations.length === 0) {
      return NextResponse.json(
        { error: "Google Drive is not connected" },
        { status: 403 },
      );
    }

    if (integrationId) {
      const integration = integrations.find((i) => i.id === integrationId);
      if (!integration) {
        return NextResponse.json(
          { error: "Integration not found" },
          { status: 404 },
        );
      }
      const accessToken = await getValidAccessToken(
        user.id,
        GOOGLE_DRIVE_PROVIDER_ID,
        integrationId,
      );
      const files = await searchDriveFiles(accessToken, q);
      return NextResponse.json({
        files: files.map((file) => ({
          ...file,
          accountEmail: integration.accountEmail,
        })),
      });
    }

    const filesByAccount = await Promise.all(
      integrations.map(async (integration) => {
        const accessToken = await getValidAccessToken(
          user.id,
          GOOGLE_DRIVE_PROVIDER_ID,
          integration.id,
        );
        const files = await searchDriveFiles(accessToken, q);
        return files.map((file) => ({
          ...file,
          accountEmail: integration.accountEmail,
        }));
      }),
    );

    return NextResponse.json({ files: filesByAccount.flat() });
  } catch (error: any) {
    console.error("Search Error:", error);
    return NextResponse.json(
      { error: "Failed to search files" },
      { status: 500 },
    );
  }
}
