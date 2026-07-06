"use client";

import { useEffect, useState } from "react";

const useIsDriveConnected = () => {
  const [isDriveConnected, setIsDriveConnected] = useState(false);

  useEffect(() => {
    fetch("/api/google_drive/status")
      .then((res) => res.json())
      .then((data) => setIsDriveConnected(data.isDriveConnected))
      .catch(() => setIsDriveConnected(false));
  }, []);

  return isDriveConnected;
};

export default useIsDriveConnected;
