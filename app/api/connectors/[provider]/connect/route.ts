import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getProvider } from "@/lib/connectors/registry";
import { setOAuthStateCookie } from "@/lib/connectors/oauth-state";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);

  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const missingEnvVars = provider.requiredEnvVars.filter(
    (name) => !process.env[name],
  );
  if (missingEnvVars.length > 0) {
    return NextResponse.json(
      { error: `Missing env vars: ${missingEnvVars.join(", ")}` },
      { status: 500 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const authUrl = provider.getAuthUrl(state);

  await setOAuthStateCookie(providerId, state);

  return NextResponse.json({ authUrl });
}
