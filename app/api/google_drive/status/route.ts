import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const isDriveConnected = !!cookieStore.get("drive_access_token")?.value;

  return Response.json({ isDriveConnected });
}
