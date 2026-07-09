"use client";

import { useCallback, useState } from "react";

const useConnectorDetail = <T,>(itemKey: string) => {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: false, error: null });

  const fetchDetail = useCallback(
    async (endpoint: string, params: Record<string, string>) => {
      setState({ data: null, loading: true, error: null });
      try {
        const qs = new URLSearchParams(params).toString();
        const response = await fetch(`${endpoint}?${qs}`);
        if (!response.ok) throw new Error(`Failed to fetch ${itemKey} detail`);
        const json = await response.json();
        setState({ data: json[itemKey] ?? null, loading: false, error: null });
      } catch (error) {
        console.error(`Error fetching ${itemKey} detail:`, error);
        setState({ data: null, loading: false, error: String(error) });
      }
    },
    [itemKey],
  );

  const reset = useCallback(
    () => setState({ data: null, loading: false, error: null }),
    [],
  );

  return { ...state, fetchDetail, reset };
};

export default useConnectorDetail;
