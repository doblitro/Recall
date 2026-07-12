import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Main from "./components/ui/Main";
import Sidebar from "./components/ui/Sidebar";
import { BrandTypeface } from "./components/ui/Brand";
import LoginButton from "./components/auth/LoginButton";
import ChangingText from "./components/ui/ChangingText";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <div
      className={`flex h-dvh w-full overflow-x-hidden
        ${!session && "items-center justify-center"}`}
    >
      {session ? (
        <>
          <Sidebar />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <main className="mx-auto max-w-[90%] lg:max-w-4/5">
              {!!isAuthenticated && <Main />}
            </main>
          </div>
        </>
      ) : (
        <div className="flex h-screen items-center justify-center px-6">
          <div className="flex max-w-lg flex-col items-center text-center">
            <BrandTypeface showDescription />

            <div className="mt-8">
              <ChangingText />
            </div>

            <div className="mt-10">
              <LoginButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
