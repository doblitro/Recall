import { prisma } from "@/lib/prisma/client";
import { getProvider } from "./registry";

export const REFRESH_BUFFER_MS = 60_000;

export async function getValidAccessToken(
  userId: string,
  providerId: string,
): Promise<string> {
  const integration = await prisma.integration.findFirst({
    where: { userId, provider: providerId, isActive: true },
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

  const refreshed = await provider.refreshAccessToken(integration.refreshToken);

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
    },
  });

  return refreshed.accessToken;
}
