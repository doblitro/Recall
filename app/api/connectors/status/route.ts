import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/db/client";
import { users, integrations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ connections: {} });
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) {
    return NextResponse.json({ connections: {} });
  }

  const activeIntegrations = await db
    .select()
    .from(integrations)
    .where(
      and(eq(integrations.userId, user.id), eq(integrations.isActive, true)),
    );

  const connections: Record<
    string,
    {
      id: string;
      accountEmail: string | null;
      accountName: string | null;
      connectedAt: Date;
    }[]
  > = {};

  for (const integration of activeIntegrations) {
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
