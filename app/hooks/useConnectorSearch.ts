"use client";

import { useQuery } from "@tanstack/react-query";

const useConnectorSearch = <T>(
  endpoint: string,
  itemsKey: string,
  searchKeyword: string,
) => {
  const { data, isFetching } = useQuery({
    queryKey: [endpoint, itemsKey, searchKeyword],
    queryFn: async ({ signal }) => {
      const response = await fetch(`${endpoint}?keyword=${searchKeyword}`, {
        signal,
      });
      if (!response.ok) throw new Error(`Failed to fetch ${itemsKey}`);
      const data = await response.json();
      return (data[itemsKey] || []) as T[];
    },
    enabled: !!searchKeyword,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return { data: data ?? [], isFetching };
};

export default useConnectorSearch;
