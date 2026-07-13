"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GOOGLE_DRIVE_PROVIDER_ID,
  GMAIL_PROVIDER_ID,
  CONNECTOR_LIST,
} from "@/lib/connectors/public";
import { initiateOAuthConnect } from "@/lib/connectors/client-connect";
import { SearchErrorEntry } from "@/lib/connectors/types";
import useDriveResults from "../drive/useDriveResults";
import useGmailResults from "../gmail/useGmailResults";
import { useSearchFilter } from "@/app/providers/SearchFilterProvider";
import FilterRow from "./FilterRow";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { ChevronDown, Search, X } from "lucide-react";
import ResultCard from "./ResultCard";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const Results = dynamic(() => import("./ResultsContainer"));

const Main = () => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const [searchKeyword, debouncer] = useDebouncedValue(
    inputValue,
    { wait: 500 },
    (state) => ({ isPending: state.isPending }),
  );

  const hasStartedSearching = inputValue.trim().length > 0;

  const [isAtBottom, setIsAtBottom] = useState(false);

  const scrollToBottom = () => {
    const el = document.getElementById("results-scroll-container");
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const { activeProvider, setActiveProvider } = useSearchFilter();

  const drive = useDriveResults(searchKeyword);
  const gmail = useGmailResults(searchKeyword);

  const isSearching =
    debouncer.state.isPending || drive.isFetching || gmail.isFetching;

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
    const seen = new Set<string>();
    const merged = [...drive.items, ...gmail.items].filter((item) => {
      if (activeProvider !== null && item.provider !== activeProvider)
        return false;

      const key = `${item.provider}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    merged.sort((a, b) => {
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

    return merged;
  }, [drive.items, gmail.items, activeProvider]);

  const toastedFailuresRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const notify = (providerId: string, error: SearchErrorEntry) => {
      const signature = `${error.integrationId}:${error.reason}`;
      if (toastedFailuresRef.current.has(signature)) return;
      toastedFailuresRef.current.add(signature);

      const label =
        CONNECTOR_LIST.find((c) => c.id === providerId)?.label ?? providerId;
      const account = error.accountEmail ?? "an account";

      if (error.reason === "reauth_required") {
        toast.error(`Couldn't search ${account} (${label})`, {
          description: "This account needs to be reconnected.",
          action: {
            label: "Reconnect",
            onClick: () => {
              initiateOAuthConnect(providerId).catch((connectError) => {
                console.error(
                  `Error initiating ${providerId} OAuth:`,
                  connectError,
                );
              });
            },
          },
        });
      } else {
        toast.error(`${label} search temporarily unavailable`, {
          description: `Couldn't search ${account} right now — try again shortly.`,
        });
      }
    };

    drive.errors.forEach((error) => notify(GOOGLE_DRIVE_PROVIDER_ID, error));
    gmail.errors.forEach((error) => notify(GMAIL_PROVIDER_ID, error));
  }, [drive.errors, gmail.errors]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        setIsSearchSticky(!entry.isIntersecting);
      },
      { threshold: 1, rootMargin: "-16px 0px 0px 0px" },
    );

    if (searchBarRef.current) {
      obs.observe(searchBarRef.current);
    }

    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = document.getElementById("results-scroll-container");
    if (!el) return;

    const checkIsAtBottom = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsAtBottom(distanceFromBottom < 32);
    };

    checkIsAtBottom();
    el.addEventListener("scroll", checkIsAtBottom, { passive: true });

    const resizeObserver = new ResizeObserver(checkIsAtBottom);
    if (el.firstElementChild) resizeObserver.observe(el.firstElementChild);

    return () => {
      el.removeEventListener("scroll", checkIsAtBottom);
      resizeObserver.disconnect();
    };
  }, [results.length, isSearching]);

  return (
    <div
      className={`flex min-h-screen w-full flex-col items-center px-4
        transition-all duration-500 ease-out ${
          hasStartedSearching || isSearching
            ? "justify-start pt-8"
            : "justify-center"
        }`}
    >
      <div ref={searchBarRef} className="h-px w-full" />
      <div
        className={`sticky top-4 z-1 w-full max-w-3xl rounded-2xl p-2
          backdrop-blur-md
          transition-[background-color,border-color,border-width,box-shadow,padding,transform]
          duration-[200ms,200ms,200ms,200ms,200ms,500ms] ease-out ${
            isSearchSticky
              ? "bg-background/90 border-border border p-4 shadow-xl"
              : "border-0 bg-transparent shadow-none"
          } ${hasStartedSearching || isSearching ? "scale-100" : "scale-105"}`}
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute
                top-1/2 left-4 h-5 w-5 -translate-y-1/2"
            />

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
              className="bg-surface text-foreground border-border
                placeholder:text-muted-foreground focus:border-accent
                focus:ring-accent/20 w-full rounded-2xl border py-3 pr-12 pl-12
                text-lg transition-all duration-200 outline-none focus:ring-2"
            />

            {inputValue.length > 0 && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setInputValue("");
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:bg-surface-hover
                  hover:text-foreground absolute top-1/2 right-2 flex h-8 w-8
                  -translate-y-1/2 items-center justify-center rounded-full
                  transition-all duration-150"
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
        className={`my-8 flex w-full max-w-4xl flex-col gap-2 transition-all
          duration-300 ${
            hasStartedSearching
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
      >
        {!isSearching ? (
          <Results results={results} />
        ) : (
          <div key="skeletons" className="animate-fade-in flex flex-col gap-2">
            <ResultCard
              key="skeleton-0"
              provider={""}
              title={undefined}
              expanded={false}
              isSkeleton
            />
            <ResultCard
              key="skeleton-1"
              provider={""}
              title={undefined}
              expanded={false}
              isSkeleton
            />
            <ResultCard
              key="skeleton-2"
              provider={""}
              title={undefined}
              expanded={false}
              isSkeleton
            />
          </div>
        )}
      </div>

      {!isSearching && results.length > 0 && !isAtBottom && (
        <button
          type="button"
          aria-label="Scroll to bottom"
          onClick={scrollToBottom}
          className="bg-surface border-border text-muted-foreground
            hover:bg-surface-hover hover:text-foreground fixed right-6 bottom-6
            z-20 flex h-10 w-10 animate-bounce cursor-pointer items-center
            justify-center rounded-full border shadow-lg transition-colors"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Main;
