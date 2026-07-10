"use client";

import LoginButton from "../auth/LoginButton";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useSearchFilter } from "@/app/providers/SearchFilterProvider";
import { BrandTypeface } from "./Brand";
import ProviderConnections from "../connectors/ProviderConnections";

const SIDEBAR_OPEN_STORAGE_KEY = "sidebar:isOpen";

const Sidebar = () => {
  const { status } = useSession();
  const { activeProvider, setActiveProvider } = useSearchFilter();
  const pathname = usePathname();
  const isConnectionsPage = pathname === "/connections";
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
    if (stored !== null) setIsOpen(stored === "true");
  }, []);

  const toggleOpen = () => {
    setIsOpen((open) => {
      const next = !open;
      localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(next));
      return next;
    });
  };

  if (status === "loading") return <p>Checking session...</p>;

  if (status === "unauthenticated") {
    return (
      <div className="relative shrink-0">
        <aside className="sticky top-0 h-screen flex flex-col justify-between bg-accent-foreground border-r border-border z-2 shadow-sm w-full p-4">
          <div className="flex flex-col gap-4">
            <BrandTypeface showDescription />
            <LoginButton />
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Hide sidebar" : "Show sidebar"}
        title={isOpen ? "Hide sidebar" : "Show sidebar"}
        className="absolute top-4 -right-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-accent-foreground shadow-sm hover:bg-accent-hover"
      >
        {isOpen ? (
          <ChevronLeftIcon width={14} height={14} />
        ) : (
          <ChevronRightIcon width={14} height={14} />
        )}
      </button>
      <aside
        className={`sticky top-0 h-screen flex flex-col justify-between bg-accent-foreground border-r border-border z-2 shadow-sm transition-all duration-200 overflow-hidden ${
          isOpen ? "w-64 p-4" : "w-0 p-0 border-r-0"
        }`}
      >
        <div className="w-full flex flex-col justify-between h-full">
          <BrandTypeface showDescription />
          <ProviderConnections />
          <LoginButton />
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
