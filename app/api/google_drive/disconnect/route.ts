import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const revokeEndpoint = "https://oauth2.googleapis.com/revoke";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("drive_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${revokeEndpoint}?token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) {
      throw new Error(`Failed to revoke token: ${response.statusText}`);
    }

    const res = NextResponse.json({
      message: "Google Drive disconnected successfully.",
    });

    res.cookies.set("drive_access_token", "", { path: "/", maxAge: 0 });
    res.cookies.set("drive_refresh_token", "", { path: "/", maxAge: 0 });
    res.cookies.set("drive_token_expiry", "", { path: "/", maxAge: 0 });

    return res;
  } catch (error) {
    console.error("Error revoking token:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google Drive." },
      { status: 500 },
    );
  }
}
