import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getActiveIntegrations, getValidAccessToken } from "@/lib/connectors/token";
import { getPrismaClient } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

async function resolveSessionUser(): Promise<
  { user: { id: string; email: string } } | { redirect: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.error("No logged in user.");
    return {
      redirect: new NextResponse(null, {
        status: 302,
        headers: { Location: "/?session_error=missing" },
      }),
    };
  }

  if (!session.user?.email) {
    console.error("Session missing user email.");
    return {
      redirect: new NextResponse(null, {
        status: 302,
        headers: { Location: "/?session_error=missing_email" },
      }),
    };
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    console.error("User does not exist.");
    return {
      redirect: new NextResponse(null, {
        status: 302,
        headers: { Location: "/?session_error=missing_user" },
      }),
    };
  }

  return { user: { id: user.id, email: user.email } };
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
        return NextResponse.json({ error: notConnectedMessage }, { status: 403 });
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

      const itemsByAccount = await Promise.all(
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

      return NextResponse.json({ [itemsKey]: itemsByAccount.flat() });
    } catch (error) {
      console.error("Search Error:", error);
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
  fetchDetail: (accessToken: string, itemId: string, keyword: string) => Promise<T>;
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

    const prisma = getPrismaClient();
    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        userId: user.id,
        provider: providerId,
        isActive: true,
      },
    });

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
      console.error("Detail Error:", error);
      return NextResponse.json(
        { error: `Failed to fetch ${itemKey} detail` },
        { status: 500 },
      );
    }
  };
}
