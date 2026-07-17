import NextAuth, { type AuthOptions } from "next-auth";
import { getPrismaClient } from "@/lib/prisma/client";
import { baseAuthOptions } from "@/lib/auth/auth-config";

export const authOptions: AuthOptions = {
  ...baseAuthOptions,
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email) {
        return false;
      }

      const prisma = getPrismaClient();
      await prisma.user.upsert({
        where: { email: profile.email },
        update: {
          name: profile.name ?? null,
        },
        create: {
          email: profile.email,
          name: profile.name ?? null,
        },
      });

      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
