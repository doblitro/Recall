import { getPrismaClient } from "@/lib/prisma/client";
import { getValidAccessToken } from "@/lib/connectors/token";
import { getSyncAdapter } from "./registry";

const CONCURRENCY = 5;

export async function runSyncForIntegration(
  integrationId: string,
): Promise<void> {
  const prisma = getPrismaClient();
  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
  });
  if (!integration || !integration.isActive) return;

  const adapter = getSyncAdapter(integration.provider);
  if (!adapter) return; // unknown/unsynced provider — no-op, not an error

  await prisma.syncCursor.upsert({
    where: { integrationId },
    create: {
      integrationId,
      provider: integration.provider,
      status: "running",
    },
    update: { status: "running" },
  });

  try {
    const accessToken = await getValidAccessToken(
      integration.userId,
      integration.provider,
      integration.id,
    );
    const cursorRow = await prisma.syncCursor.findUnique({
      where: { integrationId },
    });
    const ctx = {
      userId: integration.userId,
      integrationId,
      accessToken,
      previousCursor: cursorRow?.cursor ?? null,
    };

    const result = ctx.previousCursor
      ? await adapter.incrementalSync(ctx)
      : await adapter.fullSync(ctx);

    await prisma.$transaction([
      prisma.syncCursor.update({
        where: { integrationId },
        data: {
          cursor: result.cursor,
          status: "idle",
          lastError: null,
          lastSyncedAt: new Date(),
          ...(result.fullResync ? { lastFullSyncAt: new Date() } : {}),
        },
      }),
      prisma.integration.update({
        where: { id: integrationId },
        data: { lastSyncedAt: new Date() },
      }),
    ]);
  } catch (error) {
    console.error(`[sync] ${integration.provider} sync failed`, {
      integrationId,
      name: error instanceof Error ? error.name : "unknown",
    });
    await prisma.syncCursor.update({
      where: { integrationId },
      data: {
        status: "error",
        lastError: String((error as Error)?.message ?? error),
      },
    });
    // Swallow — a broken integration must not cancel siblings in a batch run.
    // getValidAccessToken already deactivates the integration on invalid_grant.
  }
}

export async function runSyncForAllIntegrations(): Promise<void> {
  const prisma = getPrismaClient();
  const integrations = await prisma.integration.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const queue = [...integrations];

  async function worker() {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) return;
      await runSyncForIntegration(next.id); // errors already caught inside
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
}
