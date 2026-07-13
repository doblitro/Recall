import { NextRequest, NextResponse } from "next/server";
import { resolveSessionUser } from "@/lib/auth/session";
import { searchItems } from "@/lib/search/query";
import { buildResultPayload } from "@/lib/search/present";

export async function GET(request: NextRequest) {
  const resolved = await resolveSessionUser();
  if ("redirect" in resolved) return resolved.redirect;
  const { user } = resolved;

  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");
  const provider = searchParams.get("provider");
  const pageParam = Number(searchParams.get("page") ?? "0");
  const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is required" },
      { status: 400 },
    );
  }

  try {
    const { rows, hasMore } = await searchItems(user.id, keyword, page);
    const filtered = provider
      ? rows.filter((r) => r.provider === provider)
      : rows;
    const items = filtered.map((row) => buildResultPayload(row, keyword));

    return NextResponse.json({ items, hasMore });
  } catch (error) {
    console.error("[search] query failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
