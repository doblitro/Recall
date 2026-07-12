"use client";

import { Connection } from "@/app/hooks/useConnections";
import { CONNECTOR_LIST } from "@/lib/connectors/public";
import { LogOut, PlusIcon } from "lucide-react";

const ActiveIndicator = () => {
  return <div className="h-1.5 w-1.5 rounded-full bg-green-600" />;
};

const ConnectButtons = ({
  type,
  connections,
  onRefresh,
}: {
  type: string;
  connections: Connection[];
  onRefresh: () => void;
}) => {
  const label = CONNECTOR_LIST.find((p) => p.id === type)?.label ?? type;

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
        onRefresh();
      })
      .catch((error) => {
        console.error(`Error disconnecting ${type}:`, error);
      });
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-2">
      <div className="p-1">
        {connections.map((connection) => (
          <div key={connection.id} className="w-full">
            <button
              onClick={() => handleDisconnect(connection.id)}
              className="flex w-full items-center justify-between gap-2 py-2 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <ActiveIndicator />
                <span className="min-w-0 truncate">
                  {connection.accountEmail ?? label}
                </span>
              </div>
              <LogOut className="h-3 w-3 shrink-0 rotate-180" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleConnect}
        className="bg-surface text-surface-foreground hover:bg-surface-hover flex w-full items-center justify-center border border-dashed p-2 text-xs"
      >
        Add an account <PlusIcon width={14} height={14} />
      </button>
    </div>
  );
};

export default ConnectButtons;
