"use client";

import { MergedResultItem } from "../results/types";

const ResultsContainer = ({
  results,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  results: MergedResultItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) => {
  if (results.length === 0) {
    return (
      <div key="results" className="animate-fade-in w-full text-center">
        <p className="text-foreground/50">No results.</p>
      </div>
    );
  }

  return (
    <div key="results" className="animate-fade-in flex flex-col gap-2">
      {results.map((item) => item.card)}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="text-muted-foreground hover:text-foreground mt-2 w-fit
            cursor-pointer self-center py-2 text-sm transition-colors
            disabled:opacity-50"
        >
          {isLoadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
};

export default ResultsContainer;
