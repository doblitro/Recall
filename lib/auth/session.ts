import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function resolveSessionUser(): Promise<
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

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

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
