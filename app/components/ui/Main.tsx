"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchFilter } from "@/app/providers/SearchFilterProvider";
import useSearchResults from "@/app/hooks/useSearchResults";
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

  const {
    items: results,
    isFetching,
    isFetchingNextPage,
    hasMore,
    loadMore,
    isError,
  } = useSearchResults(searchKeyword, activeProvider);

  const isSearching = debouncer.state.isPending || isFetching;

  const hasToastedErrorRef = useRef(false);

  useEffect(() => {
    if (isError && !hasToastedErrorRef.current) {
      hasToastedErrorRef.current = true;
      toast.error("Search failed", {
        description: "Something went wrong — try again shortly.",
      });
    }
    if (!isError) hasToastedErrorRef.current = false;
  }, [isError]);

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
              isSearching={isSearching}
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
          <Results
            results={results}
            hasMore={hasMore}
            isLoadingMore={isFetchingNextPage}
            onLoadMore={loadMore}
          />
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
