"use client";

import DriveFiles from "./DriveFiles";
import ConnectButtons from "../auth/ConnectButtons";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import useConnections from "@/app/hooks/useConnections";

const DriveSection = ({ children }: { children?: React.ReactNode }) => {
  const { connections } = useConnections(GOOGLE_DRIVE_PROVIDER_ID);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <ConnectButtons type={GOOGLE_DRIVE_PROVIDER_ID} />
        {connections.length > 0 && <DriveFiles />}
      </main>
    </div>
  );
};

export default DriveSection;
