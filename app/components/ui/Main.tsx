"use client";

import { useMemo, useState } from "react";
import {
  GOOGLE_DRIVE_PROVIDER_ID,
  GMAIL_PROVIDER_ID,
} from "@/lib/connectors/public";
import useDriveResults from "../drive/useDriveResults";
import useGmailResults from "../gmail/useGmailResults";
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

  const drive = useDriveResults(searchKeyword);
  const gmail = useGmailResults(searchKeyword);

  const counts = searchKeyword
    ? {
        [GOOGLE_DRIVE_PROVIDER_ID]: drive.count,
        [GMAIL_PROVIDER_ID]: gmail.count,
      }
    : undefined;
  const loadingByProvider = {
    [GOOGLE_DRIVE_PROVIDER_ID]: drive.isFetching,
    [GMAIL_PROVIDER_ID]: gmail.isFetching,
  };

  const results = useMemo(() => {
    const merged = [...drive.items, ...gmail.items].filter(
      (item) => activeProvider === null || item.provider === activeProvider,
    );
    merged.sort((a, b) => {
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
    return merged;
  }, [drive.items, gmail.items, activeProvider]);

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
            counts={counts}
            isSearching={isSearching}
            loadingByProvider={loadingByProvider}
          />
        </div>
      </div>

      <div className="flex flex-col w-full md:w-2/3 gap-2">
        {results.map((item) => item.card)}
      </div>
    </div>
  );
};

export default Main;
