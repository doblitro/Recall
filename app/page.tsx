import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Main from "./components/ui/Main";
import Sidebar from "./components/ui/Sidebar";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <div className="flex w-full overflow-x-hidden h-dvh">
      <Sidebar />
      <div className="flex-1 overflow-y-auto min-h-0">
        <main className="max-w-[90%] lg:max-w-4/5 mx-auto">
          {!!isAuthenticated && <Main />}
        </main>
      </div>
    </div>
  );
}
