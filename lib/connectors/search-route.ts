import {
  getActiveIntegrations,
  getValidAccessToken,
} from "@/lib/connectors/token";
import {
  IntegrationAuthError,
  RateLimitedError,
  GoogleAuthRequiredError,
} from "@/lib/connectors/errors";
import { getDb } from "@/lib/db/client";
import { integrations as integrationsTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { resolveSessionUser } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { SearchFailureReason, SearchErrorEntry } from "@/lib/connectors/types";

function reasonFor(error: unknown): SearchFailureReason {
  if (error instanceof IntegrationAuthError) return "reauth_required";
  if (error instanceof GoogleAuthRequiredError) return "reauth_required";
  if (error instanceof RateLimitedError) return "rate_limited";
  return "fetch_failed";
}

export function createSearchRoute<T extends object>({
  providerId,
  itemsKey,
  notConnectedMessage,
  search,
}: {
  providerId: string;
  itemsKey: string;
  notConnectedMessage: string;
  search: (accessToken: string, keyword: string) => Promise<T[]>;
}) {
  return async function GET(request: NextRequest) {
    const resolved = await resolveSessionUser();
    if ("redirect" in resolved) return resolved.redirect;
    const { user } = resolved;

    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get("keyword");
    const integrationId = searchParams.get("integrationId");

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword parameter is required" },
        { status: 400 },
      );
    }

    try {
      const integrations = await getActiveIntegrations(user.id, providerId);

      if (integrations.length === 0) {
        console.error(
          `[${providerId}] No active integrations for user ${user.id} — returning 403`,
        );
        return NextResponse.json(
          { error: notConnectedMessage },
          { status: 403 },
        );
      }

      const targetIntegrations = integrationId
        ? integrations.filter((i) => i.id === integrationId)
        : integrations;

      if (integrationId && targetIntegrations.length === 0) {
        return NextResponse.json(
          { error: "Integration not found" },
          { status: 404 },
        );
      }

      const settled = await Promise.allSettled(
        targetIntegrations.map(async (integration) => {
          const accessToken = await getValidAccessToken(
            user.id,
            providerId,
            integration.id,
          );
          const items = await search(accessToken, keyword);
          return items.map((item) => ({
            ...item,
            accountEmail: integration.accountEmail,
            integrationId: integration.id,
          }));
        }),
      );

      const items: T[] = [];
      const errors: SearchErrorEntry[] = [];

      for (let index = 0; index < settled.length; index++) {
        const result = settled[index];
        const integration = targetIntegrations[index];

        if (result.status === "fulfilled") {
          items.push(...(result.value as T[]));
          continue;
        }

        const reason = reasonFor(result.reason);
        if (result.reason instanceof GoogleAuthRequiredError) {
          await getDb()
            .update(integrationsTable)
            .set({ isActive: false })
            .where(eq(integrationsTable.id, integration.id));
        }

        console.error(`[${providerId}] search failed`, {
          integrationId: integration.id,
          reason,
        });
        errors.push({
          integrationId: integration.id,
          accountEmail: integration.accountEmail,
          reason,
        });
      }

      if (items.length === 0 && errors.length > 0) {
        return NextResponse.json(
          { error: `Failed to search ${itemsKey}`, errors },
          { status: 502 },
        );
      }

      return NextResponse.json({
        [itemsKey]: items,
        ...(errors.length > 0 ? { errors } : {}),
      });
    } catch (error) {
      console.error(`[${providerId}] search error`, {
        name: error instanceof Error ? error.name : "unknown",
      });
      return NextResponse.json(
        { error: `Failed to search ${itemsKey}` },
        { status: 500 },
      );
    }
  };
}

export function createDetailRoute<T extends object>({
  providerId,
  itemKey,
  notConnectedMessage,
  fetchDetail,
}: {
  providerId: string;
  itemKey: string;
  notConnectedMessage: string;
  fetchDetail: (
    accessToken: string,
    itemId: string,
    keyword: string,
  ) => Promise<T>;
}) {
  return async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const resolved = await resolveSessionUser();
    if ("redirect" in resolved) return resolved.redirect;
    const { user } = resolved;

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const integrationId = searchParams.get("integrationId");
    const keyword = searchParams.get("keyword") ?? "";

    if (!integrationId) {
      return NextResponse.json(
        { error: "integrationId parameter is required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const [integration] = await db
      .select()
      .from(integrationsTable)
      .where(
        and(
          eq(integrationsTable.id, integrationId),
          eq(integrationsTable.userId, user.id),
          eq(integrationsTable.provider, providerId),
          eq(integrationsTable.isActive, true),
        ),
      )
      .limit(1);

    if (!integration) {
      return NextResponse.json({ error: notConnectedMessage }, { status: 404 });
    }

    try {
      const accessToken = await getValidAccessToken(
        user.id,
        providerId,
        integration.id,
      );
      const item = await fetchDetail(accessToken, id, keyword);

      return NextResponse.json({
        [itemKey]: {
          ...item,
          accountEmail: integration.accountEmail,
          integrationId: integration.id,
        },
      });
    } catch (error) {
      console.error(`[${providerId}] detail error`, {
        integrationId: integration.id,
        name: error instanceof Error ? error.name : "unknown",
      });
      return NextResponse.json(
        { error: `Failed to fetch ${itemKey} detail` },
        { status: 500 },
      );
    }
  };
}
