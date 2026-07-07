"use client";

import { useState } from "react";
import DriveFiles from "./DriveFiles";
import ConnectButtons from "../auth/ConnectButtons";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import useConnections from "@/app/hooks/useConnections";

const DriveSection = ({ children }: { children?: React.ReactNode }) => {
  const { connections } = useConnections(GOOGLE_DRIVE_PROVIDER_ID);
  const [inputValue, setInputValue] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <ConnectButtons type={GOOGLE_DRIVE_PROVIDER_ID} />
        {connections.length > 0 && (
          <>
            <div className="flex gap-2 my-4">
              <input
                type="text"
                placeholder="Search files..."
                className="border rounded px-2 py-1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                onClick={() => setSearchKeyword(inputValue)}
              >
                Search
              </button>
            </div>
            <DriveFiles searchKeyword={searchKeyword} />
          </>
        )}
      </main>
    </div>
  );
};

export default DriveSection;
