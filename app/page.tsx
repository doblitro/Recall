import LoginButton from "./components/auth/LoginButton";
import { getServerSession } from "next-auth";
import DriveSection from "./components/drive/DriveSection";

export default function Home() {
  const session = getServerSession();
  const isAuthenticated = !!session;

  return (
    <>
      <LoginButton />
      {!!isAuthenticated && <DriveSection />}
    </>
  );
}
