import { getPrismaClient } from "@/lib/prisma/client";
import { getProvider } from "./registry";
import { IntegrationAuthError } from "./errors";

export const REFRESH_BUFFER_MS = 60_000;

export async function getActiveIntegrations(
  userId: string,
  providerId: string,
) {
  const prisma = getPrismaClient();
  return prisma.integration.findMany({
    where: { userId, provider: providerId, isActive: true },
  });
}

export async function getValidAccessToken(
  userId: string,
  providerId: string,
  integrationId: string,
): Promise<string> {
  const prisma = getPrismaClient();
  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, userId, provider: providerId, isActive: true },
  });

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
      await prisma.integration.update({
        where: { id: integration.id },
        data: { isActive: false },
      });
      throw new IntegrationAuthError(providerId, integration.id);
    }
    throw error;
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
    },
  });

  return refreshed.accessToken;
}
