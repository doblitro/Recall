import { getProvider } from "./registry";
import { IntegrationAuthError } from "./errors";
import { getDb } from "../db/client";
import { integrations } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const REFRESH_BUFFER_MS = 60_000;

export async function getActiveIntegrations(
  userId: string,
  providerId: string,
) {
  const db = getDb();
  return db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.userId, userId),
        eq(integrations.provider, providerId),
        eq(integrations.isActive, true),
      ),
    );
}

export async function getValidAccessToken(
  userId: string,
  providerId: string,
  integrationId: string,
): Promise<string> {
  const db = getDb();
  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.id, integrationId),
        eq(integrations.userId, userId),
        eq(integrations.provider, providerId),
        eq(integrations.isActive, true),
      ),
    )
    .limit(1);

  if (!integration) {
    throw new Error(`No active ${providerId} integration for this user`);
  }

  const isExpiringSoon =
    integration.expiresAt &&
    integration.expiresAt.getTime() < Date.now() + REFRESH_BUFFER_MS;

  if (!isExpiringSoon) {
    return integration.accessToken;
  }

  if (!integration.refreshToken) {
    throw new Error(`${providerId} integration has no refresh token`);
  }

  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  let refreshed;
  try {
    refreshed = await provider.refreshAccessToken(integration.refreshToken);
  } catch (error) {
    if ((error as Error & { code?: string }).code === "invalid_grant") {
      await db
        .update(integrations)
        .set({
          isActive: false,
        })
        .where(eq(integrations.id, integration.id));

      throw new IntegrationAuthError(providerId, integration.id);
    }
    throw error;
  }

  await db
    .update(integrations)
    .set({ accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt })
    .where(eq(integrations.id, integration.id));

  return refreshed.accessToken;
}
