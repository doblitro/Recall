import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProvider } from "@/lib/connectors/registry";
import { prisma } from "@/lib/prisma/client";
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

  const integration = await prisma.integration.findFirst({
    where: { userId: user.id, provider: providerId, isActive: true },
  });

  if (!integration) {
    return NextResponse.json(
      { error: `${providerId} is not connected` },
      { status: 404 },
    );
  }

  try {
    await provider.revoke(integration.accessToken);
  } catch (err: any) {
    console.error(`Failed to revoke ${providerId} token:`, err.message);
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { isActive: false, accessToken: "", refreshToken: null },
  });

  return NextResponse.json({
    message: `${provider.label} disconnected successfully.`,
  });
}
