"use client";

import { createContext, useCallback, useContext, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type ProviderFilter = string | null;

interface SearchFilterContextValue {
  activeProvider: ProviderFilter;
  setActiveProvider: (id: ProviderFilter) => void;
}

const SearchFilterContext = createContext<SearchFilterContextValue | null>(
  null,
);

function SearchFilterProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProvider = searchParams.get("provider");

  const setActiveProvider = useCallback(
    (id: ProviderFilter) => {
      const params = new URLSearchParams();
      if (id !== null) {
        params.set("provider", id);
      }
      const query = params.toString();
      router.push(query ? `/?${query}` : "/");
    },
    [router],
  );

  return (
    <SearchFilterContext.Provider value={{ activeProvider, setActiveProvider }}>
      {children}
    </SearchFilterContext.Provider>
  );
}

export function SearchFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <SearchFilterProviderInner>{children}</SearchFilterProviderInner>
    </Suspense>
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
