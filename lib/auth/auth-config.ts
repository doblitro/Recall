import { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Deliberately has no callbacks that touch Prisma. getServerSession() only
// needs this to validate/decode the session cookie — it never invokes the
// signIn callback (that only runs during the actual OAuth POST flow, handled
// by app/api/auth/[...nextauth]/route.ts, which extends this with that
// callback). Keeping this Prisma-free matters for bundle size: anything a
// Server Component (like app/page.tsx) imports gets compiled into Next's
// SSR bundle layer, separate from the Route Handler layer — importing the
// full authOptions (with its static getPrismaClient import) from a page
// duplicates Prisma's wasm query compiler into that layer too.
export const baseAuthOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
};
