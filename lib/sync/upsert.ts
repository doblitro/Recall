import { getPrismaClient } from "@/lib/prisma/client";
import { SearchItemInput } from "./types";

const CHUNK_SIZE = 50;

function chunksOf<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function upsertSearchItems(
  userId: string,
  integrationId: string,
  provider: string,
  items: SearchItemInput[],
): Promise<number> {
  if (items.length === 0) return 0;

  const prisma = getPrismaClient();

  for (const chunk of chunksOf(items, CHUNK_SIZE)) {
    await prisma.$transaction(
      chunk.map((item) =>
        prisma.searchItem.upsert({
          where: {
            integrationId_externalId: {
              integrationId,
              externalId: item.externalId,
            },
          },
          create: {
            userId,
            integrationId,
            provider,
            kind: item.kind,
            externalId: item.externalId,
            title: item.title,
            participants: item.participants,
            snippet: item.snippet,
            bodyText: item.bodyText,
            url: item.url,
            updatedAt: item.updatedAt,
            metadata: item.metadata as object,
          },
          update: {
            title: item.title,
            participants: item.participants,
            snippet: item.snippet,
            bodyText: item.bodyText,
            url: item.url,
            updatedAt: item.updatedAt,
            metadata: item.metadata as object,
            syncedAt: new Date(),
          },
        }),
      ),
    );
  }

  return items.length;
}

export async function deleteSearchItems(
  integrationId: string,
  externalIds: string[],
): Promise<number> {
  if (externalIds.length === 0) return 0;

  const prisma = getPrismaClient();
  const result = await prisma.searchItem.deleteMany({
    where: { integrationId, externalId: { in: externalIds } },
  });

  return result.count;
}
