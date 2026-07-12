"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export type Connection = {
  id: string;
  accountEmail: string | null;
  accountName: string | null;
  connectedAt: string;
};

export type ConnectionsByProvider = Record<string, Connection[]>;

const CONNECTIONS_QUERY_KEY = ["connections-status"];

const useConnections = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: CONNECTIONS_QUERY_KEY,
    queryFn: async (): Promise<ConnectionsByProvider> => {
      const response = await fetch("/api/connectors/status");
      const data = await response.json();
      return data.connections ?? {};
    },
    refetchOnWindowFocus: false,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
  };

  return {
    connectionsByProvider: data ?? {},
    refresh,
    isLoading,
  };
};

export default useConnections;
