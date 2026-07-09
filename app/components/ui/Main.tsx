"use client";

import { useState } from "react";
import {
  GOOGLE_DRIVE_PROVIDER_ID,
  GMAIL_PROVIDER_ID,
} from "@/lib/connectors/public";
import ConnectorResults from "../connectors/ConnectorResults";
import DriveFiles from "../drive/DriveFiles";
import GmailMessages from "../gmail/GmailMessages";
import { useSearchFilter } from "@/app/providers/SearchFilterProvider";

const Main = () => {
  const [inputValue, setInputValue] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const { activeProvider } = useSearchFilter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 gap-6 w-4/5">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="rounded border border-border bg-surface px-2 py-1 text-foreground"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button
          className="rounded bg-accent px-4 py-1 text-accent-foreground hover:bg-accent-hover"
          onClick={() => setSearchKeyword(inputValue)}
        >
          Search
        </button>
      </div>

      {(activeProvider === null ||
        activeProvider === GOOGLE_DRIVE_PROVIDER_ID) && (
        <ConnectorResults
          providerId={GOOGLE_DRIVE_PROVIDER_ID}
          heading="Google Drive Files"
        >
          <DriveFiles searchKeyword={searchKeyword} />
        </ConnectorResults>
      )}
      {(activeProvider === null || activeProvider === GMAIL_PROVIDER_ID) && (
        <ConnectorResults
          providerId={GMAIL_PROVIDER_ID}
          heading="Gmail Messages"
        >
          <GmailMessages searchKeyword={searchKeyword} />
        </ConnectorResults>
      )}
    </div>
  );
};

export default Main;
