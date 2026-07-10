"use client";

import { createContext, useContext, useState } from "react";

export type ProviderFilter = string | null;

interface SearchFilterContextValue {
  activeProvider: ProviderFilter;
  setActiveProvider: (id: ProviderFilter) => void;
}

const SearchFilterContext = createContext<SearchFilterContextValue | null>(
  null,
);

export function SearchFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeProvider, setActiveProvider] = useState<ProviderFilter>(null);

  return (
    <SearchFilterContext.Provider value={{ activeProvider, setActiveProvider }}>
      {children}
    </SearchFilterContext.Provider>
  );
}

export function useSearchFilter() {
  const context = useContext(SearchFilterContext);
  if (!context) {
    throw new Error(
      "useSearchFilter must be used within a SearchFilterProvider",
    );
  }
  return context;
}
