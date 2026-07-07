"use client";

import { useCallback, useEffect, useState } from "react";

export type Connection = {
  id: string;
  accountEmail: string | null;
  accountName: string | null;
  connectedAt: string;
};

const useConnections = (provider: string) => {
  const [connections, setConnections] = useState<Connection[]>([]);

  const refresh = useCallback(() => {
    fetch(`/api/connectors/${provider}/status`)
      .then((res) => res.json())
      .then((data) => setConnections(data.connections ?? []))
      .catch(() => setConnections([]));
  }, [provider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { connections, refresh };
};

export default useConnections;
