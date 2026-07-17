import { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Deliberately has no callbacks that touch the database. getServerSession()
// only needs this to validate/decode the session cookie — it never invokes
// the signIn callback (that only runs during the actual OAuth POST flow,
// handled by app/api/auth/[...nextauth]/route.ts, which extends this with
// that callback). Keeping DB access out of anything a Server Component (like
// app/page.tsx) imports is good practice regardless of ORM, since that code
// gets compiled into Next's SSR bundle layer, separate from the Route
// Handler layer.
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
