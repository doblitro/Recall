"use client";

import { useEffect, useState } from "react";

const useConnectorSearch = <T,>(
  endpoint: string,
  itemsKey: string,
  searchKeyword: string,
) => {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    if (!searchKeyword) {
      setItems([]);
      return;
    }

    let cancelled = false;

    const fetchItems = async () => {
      try {
        const response = await fetch(`${endpoint}?keyword=${searchKeyword}`);
        if (!response.ok) throw new Error(`Failed to fetch ${itemsKey}`);
        const data = await response.json();
        if (!cancelled) setItems(data[itemsKey] || []);
      } catch (error) {
        console.error(`Error fetching ${itemsKey}:`, error);
        if (!cancelled) setItems([]);
      }
    };

    fetchItems();

    return () => {
      cancelled = true;
    };
  }, [endpoint, itemsKey, searchKeyword]);

  return items;
};

export default useConnectorSearch;
