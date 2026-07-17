import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { readAndClearOAuthStateCookie } from "@/lib/connectors/oauth-state";
import { getProvider } from "@/lib/connectors/registry";
import { getDb } from "@/lib/db/client";
import { integrations, users } from "@/lib/db/schema";
import { runSyncForIntegration } from "@/lib/sync/orchestrator";
import { getServerSession } from "next-auth";
import { NextResponse, after } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("Provider denied the OAuth request:", error);
    return new Response(null, {
      status: 302,
      headers: { Location: "/?provider_error=oauth_denied" },
    });
  }
  if (!code || !state) {
    console.error("Provider callback missing code or state.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?provider_error=missing_params" },
    });
  }

  const { provider: providerId } = await params;

  const provider = getProvider(providerId);

  if (!provider) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerId}` },
      { status: 404 },
    );
  }

  const oauthState = await readAndClearOAuthStateCookie();

  if (!oauthState) {
    return NextResponse.json(
      { error: "Missing OAuth cookie." },
      { status: 500 },
    );
  }

  if (oauthState.provider !== providerId || oauthState.state !== state) {
    console.error("OAuth state mismatch.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?provider_error=invalid_state" },
    });
  }

  let tokens;
  try {
    tokens = await provider?.exchangeCodeForTokens(code);
  } catch (err) {
    console.error(err);
  }

  if (!tokens) {
    return NextResponse.json(
      { error: "Failed to exchange code for tokens." },
      { status: 500 },
    );
  }

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

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    console.error("User does not exist.");
    return new Response(null, {
      status: 302,
      headers: { Location: "/?session_error=missing_user" },
    });
  }

  const [integration] = await db
    .insert(integrations)
    .values({
      userId: user.id,
      provider: providerId,
      providerAccountId: tokens.providerAccountId,
      accountEmail: tokens.accountEmail,
      accountName: tokens.accountName,
      accountAvatar: tokens.accountAvatar,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [integrations.provider, integrations.providerAccountId],
      set: {
        userId: user.id,
        accountEmail: tokens.accountEmail,
        accountName: tokens.accountName,
        accountAvatar: tokens.accountAvatar,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        isActive: true,
      },
    })
    .returning();

  // Kick off an initial sync without blocking the redirect response — after()
  // maps onto ctx.waitUntil on Cloudflare/OpenNext, so this keeps running
  // once the response has been sent.
  after(() => runSyncForIntegration(integration.id));

  return new Response(null, {
    status: 302,
    headers: { Location: `/?connected=${providerId}` },
  });
}
