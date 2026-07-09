import LoginButton from "./components/auth/LoginButton";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Main from "./components/ui/Main";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <main className="flex flex-col w-full items-center">
      <div className="w-4/5">
        <LoginButton />
        {!!isAuthenticated && <Main />}
      </div>
    </main>
  );
}
