"use client";

import useIsDriveConnected from "@/app/hooks/useIsDriveConnected";
import GoogleDriveConnect from "../auth/GoogleDriveConnect";
import DriveFiles from "./DriveFiles";

const DriveSection = ({ children }: { children?: React.ReactNode }) => {
  const isDriveConnected = useIsDriveConnected();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <GoogleDriveConnect />
        {!!isDriveConnected && <DriveFiles />}
      </main>
    </div>
  );
};

export default DriveSection;
