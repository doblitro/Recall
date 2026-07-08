"use client";

import { useState } from "react";
import {
  GOOGLE_DRIVE_PROVIDER_ID,
  GMAIL_PROVIDER_ID,
} from "@/lib/connectors/public";
import ProviderConnections from "../connectors/ProviderConnections";
import ConnectorResults from "../connectors/ConnectorResults";
import DriveFiles from "../drive/DriveFiles";
import GmailMessages from "../gmail/GmailMessages";

const Main = () => {
  const [inputValue, setInputValue] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 gap-6">
      <ProviderConnections />

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search..."
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

      <ConnectorResults
        providerId={GOOGLE_DRIVE_PROVIDER_ID}
        heading="Google Drive Files"
      >
        <DriveFiles searchKeyword={searchKeyword} />
      </ConnectorResults>
      <ConnectorResults providerId={GMAIL_PROVIDER_ID} heading="Gmail Messages">
        <GmailMessages searchKeyword={searchKeyword} />
      </ConnectorResults>
    </div>
  );
};

export default Main;
