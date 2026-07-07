import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProvider } from "@/lib/connectors/registry";
import { prisma } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;

  if (!getProvider(providerId)) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerId}` },
      { status: 404 },
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ connections: [] });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ connections: [] });
  }

  const integrations = await prisma.integration.findMany({
    where: { userId: user.id, provider: providerId, isActive: true },
  });

  return NextResponse.json({
    connections: integrations.map((integration) => ({
      id: integration.id,
      accountEmail: integration.accountEmail,
      accountName: integration.accountName,
      connectedAt: integration.connectedAt,
    })),
  });
}
