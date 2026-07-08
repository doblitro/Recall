import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getActiveIntegrations, getValidAccessToken } from "@/lib/connectors/token";
import { getPrismaClient } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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
    const session = await getServerSession(authOptions);

    if (!session) {
      console.error("No logged in user.");
      return new Response(null, {
        status: 302,
        headers: { Location: "/?session_error=missing" },
      });
    }

    if (!session.user?.email) {
      console.error("Session missing user email.");
      return new Response(null, {
        status: 302,
        headers: { Location: "/?session_error=missing_email" },
      });
    }

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error("User does not exist.");
      return new Response(null, {
        status: 302,
        headers: { Location: "/?session_error=missing_user" },
      });
    }

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
