import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPrismaClient } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ connections: {} });
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ connections: {} });
  }

  const integrations = await prisma.integration.findMany({
    where: { userId: user.id, isActive: true },
  });

  const connections: Record<
    string,
    {
      id: string;
      accountEmail: string | null;
      accountName: string | null;
      connectedAt: Date;
    }[]
  > = {};

  for (const integration of integrations) {
    const list = (connections[integration.provider] ??= []);
    list.push({
      id: integration.id,
      accountEmail: integration.accountEmail,
      accountName: integration.accountName,
      connectedAt: integration.connectedAt,
    });
  }

  return NextResponse.json({ connections });
}
