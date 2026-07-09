"use client";

import { SessionProvider } from "next-auth/react";
import { SearchFilterProvider } from "./SearchFilterProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SearchFilterProvider>{children}</SearchFilterProvider>
    </SessionProvider>
  );
}
