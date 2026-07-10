import LoginButton from "./components/auth/LoginButton";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Main from "./components/ui/Main";
import Sidebar from "./components/ui/Sidebar";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <main className="flex w-full">
      <Sidebar />
      <div className="w-full flex justify-center min-w-0">
        {!!isAuthenticated && <Main />}
      </div>
    </main>
  );
}
