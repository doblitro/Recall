import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPrismaClient } from "@/lib/prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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
