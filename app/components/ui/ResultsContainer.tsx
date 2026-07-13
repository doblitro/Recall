"use client";

import { useState } from "react";
import { MergedResultItem } from "../results/types";
import { ChevronDown } from "lucide-react";

const PAGE_SIZE = 30;

const ResultsContainer = ({ results }: { results: MergedResultItem[] }) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (results.length === 0) {
    return (
      <div key="results" className="animate-fade-in w-full text-center">
        <p className="text-foreground/50">No results.</p>
      </div>
    );
  }

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  return (
    <div key="results" className="animate-fade-in flex flex-col gap-2">
      {visibleResults.map((item) => item.card)}

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          className="text-muted-foreground hover:text-foreground mt-2 w-fit
            cursor-pointer self-center py-2 text-sm transition-colors"
        >
          Load {PAGE_SIZE} more ({visibleCount}/{results.length - visibleCount})
        </button>
      )}
    </div>
  );
};

export default ResultsContainer;
