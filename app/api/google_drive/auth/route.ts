import { google } from "googleapis";
import { randomBytes } from "crypto";
import { NextRequest } from "next/server";

export async function POST() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const errors: string[] = [];

  if (!clientId) {
    errors.push("Missing GOOGLE_CLIENT_ID in environment");
  }
  if (!clientSecret) {
    errors.push("Missing GOOGLE_CLIENT_SECRET in environment");
  }
  if (!redirectUri) {
    errors.push("Missing GOOGLE_REDIRECT_URI in environment");
  }

  if (errors.length > 0) {
    return new Response(JSON.stringify({ error: errors.join(", ") }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  const state = randomBytes(16).toString("hex");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state,
    scope: [
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });

  const drive_oauth_state = {
    state,
    createdAt: new Date().toISOString(),
  };

  const cookieOptions = [
    `drive_oauth_state=${encodeURIComponent(JSON.stringify(drive_oauth_state))}`,
    "HttpOnly",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=300",
  ];

  return new Response(JSON.stringify({ authUrl }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieOptions.filter(Boolean).join("; "),
    },
  });
}
