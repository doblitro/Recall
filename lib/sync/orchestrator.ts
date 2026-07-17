import { getValidAccessToken } from "@/lib/connectors/token";
import { getSyncAdapter } from "./registry";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { syncCursors, integrations } from "../db/schema";

const CONCURRENCY = 5;

export async function runSyncForIntegration(
  integrationId: string,
): Promise<void> {
  const db = getDb();
  const [integration] = await db
    .select()
    .from(integrations)
    .where(eq(integrations.id, integrationId))
    .limit(1);
  if (!integration || !integration.isActive) return;

  const adapter = getSyncAdapter(integration.provider);
  if (!adapter) return; // unknown/unsynced provider — no-op, not an error

  await db
    .insert(syncCursors)
    .values({
      integrationId,
      provider: integration.provider,
      status: "running",
    })
    .onConflictDoUpdate({
      target: syncCursors.integrationId,
      set: { status: "running" },
    });

  try {
    const accessToken = await getValidAccessToken(
      integration.userId,
      integration.provider,
      integration.id,
    );
    const [cursorRow] = await db
      .select()
      .from(syncCursors)
      .where(eq(syncCursors.integrationId, integrationId))
      .limit(1);
    const ctx = {
      userId: integration.userId,
      integrationId,
      accessToken,
      previousCursor: cursorRow?.cursor ?? null,
    };

    const result = ctx.previousCursor
      ? await adapter.incrementalSync(ctx)
      : await adapter.fullSync(ctx);

    await db.batch([
      db
        .update(syncCursors)
        .set({
          cursor: result.cursor,
          status: "idle",
          lastError: null,
          lastSyncedAt: new Date(),
          ...(result.fullResync ? { lastFullSyncAt: new Date() } : {}),
        })
        .where(eq(syncCursors.integrationId, integrationId)),
      db
        .update(integrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(integrations.id, integrationId)),
    ]);
  } catch (error) {
    console.error(`[sync] ${integration.provider} sync failed`, {
      integrationId,
      name: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
    await db
      .update(syncCursors)
      .set({
        status: "error",
        lastError: String((error as Error)?.message ?? error),
      })
      .where(eq(syncCursors.integrationId, integrationId));
    // Swallow — a broken integration must not cancel siblings in a batch run.
    // getValidAccessToken already deactivates the integration on invalid_grant.
  }
}

export async function runSyncForAllIntegrations(): Promise<void> {
  const db = getDb();
  const activeIntegrations = await db
    .select({ id: integrations.id })
    .from(integrations)
    .where(eq(integrations.isActive, true));

  const queue = [...activeIntegrations];

  async function worker() {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) return;
      await runSyncForIntegration(next.id); // errors already caught inside
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
}
