"use client";

import { useCallback, useState } from "react";
import {
  GOOGLE_DRIVE_PROVIDER_ID,
  GMAIL_PROVIDER_ID,
} from "@/lib/connectors/public";
import ConnectorResults from "../connectors/ConnectorResults";
import DriveFiles from "../drive/DriveFiles";
import GmailMessages from "../gmail/GmailMessages";
import { useSearchFilter } from "@/app/providers/SearchFilterProvider";
import FilterRow from "./FilterRow";
import { useDebouncedValue } from "@tanstack/react-pacer";

const Main = () => {
  const [inputValue, setInputValue] = useState("");
  const [searchKeyword, debouncer] = useDebouncedValue(
    inputValue,
    { wait: 500 },
    (state) => ({ isPending: state.isPending }),
  );
  const { activeProvider, setActiveProvider } = useSearchFilter();

  const isSearching = debouncer.state.isPending;

  const [counts, setCounts] = useState<Partial<Record<string, number>>>({});
  const [loadingByProvider, setLoadingByProvider] = useState<
    Partial<Record<string, boolean>>
  >({});

  const handleDriveCount = useCallback((count: number, isFetching: boolean) => {
    setCounts((c) => ({ ...c, [GOOGLE_DRIVE_PROVIDER_ID]: count }));
    setLoadingByProvider((l) => ({
      ...l,
      [GOOGLE_DRIVE_PROVIDER_ID]: isFetching,
    }));
  }, []);
  const handleGmailCount = useCallback((count: number, isFetching: boolean) => {
    setCounts((c) => ({ ...c, [GMAIL_PROVIDER_ID]: count }));
    setLoadingByProvider((l) => ({ ...l, [GMAIL_PROVIDER_ID]: isFetching }));
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen py-2 px-4 gap-6 w-full">
      <div className="flex flex-col gap-2 md:w-2/3">
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded border border-border bg-surface px-2 py-1 text-foreground"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        <div className="overflow-auto">
          <FilterRow
            activeProvider={activeProvider}
            setActiveProvider={setActiveProvider}
            counts={searchKeyword ? counts : undefined}
            isSearching={isSearching}
            loadingByProvider={loadingByProvider}
          />
        </div>
      </div>

      <ConnectorResults
        providerId={GOOGLE_DRIVE_PROVIDER_ID}
        heading="Google Drive Files"
        hidden={
          activeProvider !== null && activeProvider !== GOOGLE_DRIVE_PROVIDER_ID
        }
      >
        <DriveFiles
          searchKeyword={searchKeyword}
          onCountChange={handleDriveCount}
        />
      </ConnectorResults>
      <ConnectorResults
        providerId={GMAIL_PROVIDER_ID}
        heading="Gmail Messages"
        hidden={activeProvider !== null && activeProvider !== GMAIL_PROVIDER_ID}
      >
        <GmailMessages
          searchKeyword={searchKeyword}
          onCountChange={handleGmailCount}
        />
      </ConnectorResults>
    </div>
  );
};

export default Main;
