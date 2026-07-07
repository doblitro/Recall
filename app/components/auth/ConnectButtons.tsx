"use client";

import useIsConnected from "@/app/hooks/useIsConnected";
import { CONNECTOR_LIST } from "@/lib/connectors/public";
import { useSession } from "next-auth/react";
import { useState } from "react";

const ConnectButtons = ({ type }: { type: string }) => {
  const { data: session, status } = useSession();
  const isConnected = useIsConnected(type);
  const label = CONNECTOR_LIST.find((p) => p.id === type)?.label ?? type;
  const [showAdd, setShowAdd] = useState(true);

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

    setShowAdd(!showAdd);
  };

  const handleDisconnect = () => {
    fetch(`/api/connectors/${type}/disconnect`, {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to disconnect ${type}`);
        }
        window.location.reload();
      })
      .catch((error) => {
        console.error(`Error disconnecting ${type}:`, error);
      });

    setShowAdd(!showAdd);
  };

  return (
    <div>
      <button
        onClick={() => (isConnected ? handleDisconnect() : handleConnect())}
        className={
          `px-4 py-2 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed` +
          (isConnected
            ? " bg-red-600 hover:bg-red-700"
            : " bg-blue-600 hover:bg-blue-700")
        }
      >
        {isConnected ? `Disconnect ${label}` : `Connect to ${label}`}
      </button>
    </div>
  );
};

export default ConnectButtons;
