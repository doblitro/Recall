"use client";
import useIsDriveConnected from "@/app/hooks/useIsDriveConnected";
import { useSession } from "next-auth/react";

const GoogleDriveConnect = () => {
  const { data: session, status } = useSession();
  const isDriveConnected = useIsDriveConnected();

  if (status === "loading") return <p>Checking session...</p>;
  if (!session) return <p>Please log into the app first.</p>;

  const handleConnect = () => {
    fetch("/api/google_drive/connect", {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to initiate Google Drive OAuth");
        }
        return response.json();
      })
      .then((data) => {
        const { authUrl } = data;
        window.location.href = authUrl;
      })
      .catch((error) => {
        console.error("Error initiating Google Drive OAuth:", error);
      });
  };

  const handleDisconnect = () => {
    fetch("/api/google_drive/disconnect", {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to disconnect Google Drive");
        }
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error disconnecting Google Drive:", error);
      });
  };

  return (
    <div>
      <button
        onClick={() =>
          isDriveConnected ? handleDisconnect() : handleConnect()
        }
        className={
          `px-4 py-2 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed` +
          (isDriveConnected
            ? " bg-red-600 hover:bg-red-700"
            : " bg-blue-600 hover:bg-blue-700")
        }
      >
        {isDriveConnected
          ? "Disconnect Google Drive"
          : "Connect to Google Drive"}
      </button>
    </div>
  );
};

export default GoogleDriveConnect;
