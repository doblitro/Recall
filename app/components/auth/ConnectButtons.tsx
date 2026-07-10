"use client";

import useConnections from "@/app/hooks/useConnections";
import { CONNECTOR_LIST } from "@/lib/connectors/public";
import { LogOut, PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";

const ConnectButtons = ({ type }: { type: string }) => {
  const { data: session, status } = useSession();
  const { connections, refresh } = useConnections(type);
  const label = CONNECTOR_LIST.find((p) => p.id === type)?.label ?? type;

  if (status === "loading") return <p>Checking session...</p>;
  if (!session) return <p>Please log into the app first.</p>;

  const handleConnect = () => {
    fetch(`/api/connectors/${type}/connect`, {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to initiate ${type} OAuth`);
        }
        return response.json();
      })
      .then((data) => {
        const { authUrl } = data;
        window.location.href = authUrl;
      })
      .catch((error) => {
        console.error(`Error initiating ${type} OAuth:`, error);
      });
  };

  const handleDisconnect = (integrationId: string) => {
    fetch(`/api/connectors/${type}/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ integrationId }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to disconnect ${type}`);
        }
        refresh();
      })
      .catch((error) => {
        console.error(`Error disconnecting ${type}:`, error);
      });
  };

  return (
    <div className="flex w-full flex-col gap-2 items-stretch">
      {connections.map((connection) => (
        <div key={connection.id} className="w-full">
          <button
            onClick={() => handleDisconnect(connection.id)}
            className="flex w-full items-center justify-between gap-2 rounded bg-danger px-4 py-2 text-danger-foreground whitespace-nowrap hover:bg-danger-hover"
          >
            <span className="truncate">{connection.accountEmail ?? label}</span>
            <LogOut className="rotate-180 w-3 h-3 shrink-0" />
          </button>
        </div>
      ))}
      <button
        onClick={handleConnect}
        className="flex w-full items-center justify-center rounded bg-accent px-4 py-2 text-accent-foreground hover:bg-accent-hover"
      >
        <PlusIcon />
      </button>
    </div>
  );
};

export default ConnectButtons;
