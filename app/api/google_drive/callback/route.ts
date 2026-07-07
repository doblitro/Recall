import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma/client";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || "",
  process.env.GOOGLE_CLIENT_SECRET || "",
  process.env.GOOGLE_REDIRECT_URI || "",
);

const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("Google denied the Drive OAuth request:", error);
    return new Response(null, {
      status: 302,
      headers: { Location: "/?drive_error=oauth_denied" },
    });
  }
  if (!code || !state) {
    console.error("Drive OAuth callback missing code or state.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?drive_error=missing_params" },
    });
  }

  // Retrieve the stored state from the cookie.
  const cookies = request.headers.get("cookie");
  const driveOauthStateCookie = cookies
    ?.split(";")
    .find((c) => c.trim().startsWith("drive_oauth_state="));

  if (!driveOauthStateCookie) {
    console.error("Missing drive_oauth_state cookie.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?drive_error=missing_state_cookie" },
    });
  }

  let driveOauthState;
  try {
    driveOauthState = JSON.parse(
      decodeURIComponent(driveOauthStateCookie.split("=")[1]),
    );
  } catch (err: any) {
    console.error("Invalid drive_oauth_state cookie.", err.message);
    return new Response(null, {
      status: 302,
      headers: { Location: "/?drive_error=invalid_state_cookie" },
    });
  }

  if (state !== driveOauthState.state) {
    console.error("State mismatch. Possible CSRF attack.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?drive_error=invalid_state" },
    });
  }

  let tokens;
  try {
    const response = await oauth2Client.getToken(code);
    tokens = response.tokens;
  } catch (err: any) {
    console.error("Drive OAuth token exchange failed:", err.message);
    return new Response(null, {
      status: 302,
      headers: { Location: "/?drive_error=token_exchange_failed" },
    });
  }

  const session = (await getServerSession(authOptions)) as Session | null;
  const userEmail = session?.user?.email;

  const expiresIn = tokens.expiry_date
    ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
    : 3600;

  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (user) {
      await prisma.integration.create({
        data: {
          userId: user.id,
          provider: "google_drive",
          providerAccountId: user.id,
          accountEmail: userEmail,
          accountName: session?.user?.name ?? userEmail,
          accessToken: tokens.access_token ?? "",
          refreshToken: tokens.refresh_token ?? null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
        },
      });
    } else {
      console.warn("No user found for Google Drive integration insert", {
        userEmail,
      });
    }
  }

  const headers = new Headers();
  headers.append("Location", "/?drive_connected=1");
  headers.append(
    "Set-Cookie",
    `drive_oauth_state=; HttpOnly; Path=/; Max-Age=0${secureFlag}`,
  );
  headers.append(
    "Set-Cookie",
    `drive_access_token=${tokens.access_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${expiresIn}${secureFlag}`,
  );
  headers.append(
    "Set-Cookie",
    `drive_refresh_token=${tokens.refresh_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secureFlag}`,
  );
  headers.append(
    "Set-Cookie",
    `drive_token_expiry=${tokens.expiry_date}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${expiresIn}${secureFlag}`,
  );

  return new Response(null, { status: 302, headers });
}
