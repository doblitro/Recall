import { cookies } from "next/headers";

const COOKIE_NAME = "connector_oauth_state";

export async function setOAuthStateCookie(provider: string, state: string) {
  const connector_oauth_state = {
    provider,
    state,
    createdAt: new Date().toISOString(),
  };

  const cookieStore = await cookies();

  cookieStore.set({
    name: COOKIE_NAME,
    value: JSON.stringify(connector_oauth_state),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });
}

export async function readAndClearOAuthStateCookie() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);

  cookieStore.delete(COOKIE_NAME);

  return cookie ? JSON.parse(cookie.value) : null;
}
