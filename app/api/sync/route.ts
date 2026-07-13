import { NextRequest, NextResponse } from "next/server";
import { resolveSessionUser } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/prisma/client";
import { runSyncForIntegration } from "@/lib/sync/orchestrator";

interface SyncRequestBody {
  integrationId?: string;
}

interface SyncResultEntry {
  integrationId: string;
  provider: string;
  ok: boolean;
}

export async function POST(request: NextRequest) {
  const resolved = await resolveSessionUser();
  if ("redirect" in resolved) return resolved.redirect;
  const { user } = resolved;

  let body: SyncRequestBody = {};
  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    // no body provided — sync all integrations
  }

  const prisma = getPrismaClient();

  const integrations = body.integrationId
    ? await prisma.integration.findMany({
        where: { id: body.integrationId, userId: user.id, isActive: true },
      })
    : await prisma.integration.findMany({
        where: { userId: user.id, isActive: true },
      });

  if (body.integrationId && integrations.length === 0) {
    return NextResponse.json(
      { error: "Integration not found" },
      { status: 404 },
    );
  }

  const results: SyncResultEntry[] = [];

  for (const integration of integrations) {
    try {
      await runSyncForIntegration(integration.id);
      results.push({
        integrationId: integration.id,
        provider: integration.provider,
        ok: true,
      });
    } catch (error) {
      console.error("[sync] manual sync failed", {
        integrationId: integration.id,
        name: error instanceof Error ? error.name : "unknown",
      });
      results.push({
        integrationId: integration.id,
        provider: integration.provider,
        ok: false,
      });
    }
  }

  return NextResponse.json({ results });
}
