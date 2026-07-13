"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchErrorEntry } from "@/lib/connectors/types";

interface ConnectorSearchResult<T> {
  items: T[];
  errors: SearchErrorEntry[];
}

const useConnectorSearch = <T>(
  endpoint: string,
  itemsKey: string,
  searchKeyword: string,
) => {
  const { data, isFetching } = useQuery({
    queryKey: [endpoint, itemsKey, searchKeyword],
    queryFn: async ({ signal }): Promise<ConnectorSearchResult<T>> => {
      const response = await fetch(`${endpoint}?keyword=${searchKeyword}`, {
        signal,
      });
      const json = await response.json();
      if (!response.ok && !json?.errors) {
        throw new Error(`Failed to fetch ${itemsKey}`);
      }
      return {
        items: (json[itemsKey] || []) as T[],
        errors: (json.errors || []) as SearchErrorEntry[],
      };
    },
    enabled: !!searchKeyword,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    data: data?.items ?? [],
    errors: data?.errors ?? [],
    isFetching,
  };
};

export default useConnectorSearch;
