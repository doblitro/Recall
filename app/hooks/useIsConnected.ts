"use client";

import { useEffect, useState } from "react";

const useIsConnected = (provider: string) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetch(`/api/connectors/${provider}/status`)
      .then((res) => res.json())
      .then((data) => setIsConnected(data.connected))
      .catch(() => setIsConnected(false));
  }, [provider]);

  return isConnected;
};

export default useIsConnected;
