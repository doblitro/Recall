import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProvider } from "@/lib/connectors/registry";
import { getDb } from "@/lib/db/client";
import { users, integrations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ provider: string }>;
  },
) {
  const { provider: providerId } = await params;

  const provider = getProvider(providerId);

  if (!provider) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerId}` },
      { status: 404 },
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

  const { integrationId } = await request.json();

  if (!integrationId) {
    return NextResponse.json(
      { error: "integrationId is required" },
      { status: 400 },
    );
  }

  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.id, integrationId),
        eq(integrations.userId, user.id),
        eq(integrations.provider, providerId),
        eq(integrations.isActive, true),
      ),
    )
    .limit(1);

  if (!integration) {
    return NextResponse.json(
      { error: `${providerId} is not connected` },
      { status: 404 },
    );
  }

  try {
    await provider.revoke(integration.accessToken);
  } catch (err) {
    console.error(`Failed to revoke ${providerId} token:`, err);
  }

  await db
    .update(integrations)
    .set({ isActive: false, accessToken: "", refreshToken: null })
    .where(eq(integrations.id, integration.id));

  return NextResponse.json({
    message: `${provider.label} disconnected successfully.`,
  });
}
