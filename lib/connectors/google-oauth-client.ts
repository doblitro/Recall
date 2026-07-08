import { OAuth2Client } from "google-auth-library";

export function createGoogleOAuthClient(providerId: string) {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/connectors/${providerId}/callback`,
  );
}

export async function fetchGoogleUserProfile(client: OAuth2Client) {
  const { data } = await client.request<{
    id: string;
    email?: string;
    name?: string;
    picture?: string;
  }>({ url: "https://www.googleapis.com/oauth2/v2/userinfo" });

  return data;
}
