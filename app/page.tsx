import LoginButton from "./components/auth/LoginButton";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import DriveSection from "./components/drive/DriveSection";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <>
      <LoginButton />
      {!!isAuthenticated && <DriveSection />}
    </>
  );
}
