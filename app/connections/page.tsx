import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Sidebar from "../components/ui/Sidebar";
import ProviderConnections from "../components/connectors/ProviderConnections";

export default async function ConnectionsPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session;

  return (
    <main className="flex w-full">
      <Sidebar />
      <div className="w-full flex justify-center py-8">
        {isAuthenticated ? (
          <div className="flex flex-col gap-6 items-center">
            <h1 className="text-xl font-semibold">Connections</h1>
            <ProviderConnections />
          </div>
        ) : (
          <p>Please log into the app first.</p>
        )}
      </div>
    </main>
  );
}
