"use client";

import { useMemo, useRef, useState } from "react";
import {
  GOOGLE_DRIVE_PROVIDER_ID,
  GMAIL_PROVIDER_ID,
} from "@/lib/connectors/public";
import useDriveResults from "../drive/useDriveResults";
import useGmailResults from "../gmail/useGmailResults";
import { useSearchFilter } from "@/app/providers/SearchFilterProvider";
import FilterRow from "./FilterRow";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Search, X } from "lucide-react";

const Main = () => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchKeyword, debouncer] = useDebouncedValue(
    inputValue,
    { wait: 500 },
    (state) => ({ isPending: state.isPending }),
  );

  const hasStartedSearching = inputValue.trim().length > 0;
  const isSearching = debouncer.state.isPending;

  const { activeProvider, setActiveProvider } = useSearchFilter();

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
    <div
      className={`flex min-h-screen w-full flex-col items-center px-4 transition-all duration-500 ease-out ${
        hasStartedSearching || isSearching
          ? "justify-start pt-8"
          : "justify-center"
      }`}
    >
      <div
        className={`w-full max-w-3xl transition-all duration-500 ease-out ${
          hasStartedSearching || isSearching ? "scale-100" : "scale-105"
        }`}
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />

            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setInputValue("");
                  inputRef.current?.focus();
                }
              }}
              className="bg-surface text-foreground border-border placeholder:text-muted-foreground focus:border-accent focus:ring-accent/20 w-full rounded-2xl border py-3 pr-12 pl-12 text-lg transition-all duration-200 outline-none focus:ring-2"
            />

            {inputValue.length > 0 && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setInputValue("");
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:bg-surface-hover hover:text-foreground absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-150"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <FilterRow
              activeProvider={activeProvider}
              setActiveProvider={setActiveProvider}
              counts={counts}
              isSearching={isSearching}
              loadingByProvider={loadingByProvider}
            />
          </div>
        </div>
      </div>

      <div
        className={`mt-8 flex w-full max-w-4xl flex-col gap-2 transition-all duration-300 ${
          hasStartedSearching
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {results.map((item) => item.card)}
      </div>
    </div>
  );
};

export default Main;
