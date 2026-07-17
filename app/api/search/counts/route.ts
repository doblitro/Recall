import { NextRequest, NextResponse } from "next/server";
import { resolveSessionUser } from "@/lib/auth/session";
import { getSearchCounts } from "@/lib/search/query";

export async function GET(request: NextRequest) {
  const resolved = await resolveSessionUser();
  if ("redirect" in resolved) return resolved.redirect;
  const { user } = resolved;

  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "Keyword parameter is required" },
      { status: 400 },
    );
  }

  try {
    const counts = await getSearchCounts(user.id, keyword);
    return NextResponse.json({ counts });
  } catch (error) {
    console.error("[search/counts] query failed", {
      name: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
