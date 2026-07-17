import NextAuth, { type AuthOptions } from "next-auth";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { baseAuthOptions } from "@/lib/auth/auth-config";

export const authOptions: AuthOptions = {
  ...baseAuthOptions,
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) {
        return false;
      }

      const db = getDb();
      await db
        .insert(users)
        .values({ email: profile.email, name: profile.name ?? null })
        .onConflictDoUpdate({
          target: users.email,
          set: { name: profile.name ?? null },
        });

      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
