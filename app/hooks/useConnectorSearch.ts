"use client";

import { useQuery } from "@tanstack/react-query";

const useConnectorSearch = <T>(
  endpoint: string,
  itemsKey: string,
  searchKeyword: string,
) => {
  const { data, isFetching } = useQuery({
    queryKey: [endpoint, itemsKey, searchKeyword],
    queryFn: async () => {
      const response = await fetch(`${endpoint}?keyword=${searchKeyword}`);
      if (!response.ok) throw new Error(`Failed to fetch ${itemsKey}`);
      const data = await response.json();
      return (data[itemsKey] || []) as T[];
    },
    enabled: !!searchKeyword,
  });

  return { data: data ?? [], isFetching };
};

export default useConnectorSearch;
