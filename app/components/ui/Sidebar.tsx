"use client";

import LoginButton from "../auth/LoginButton";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { BrandTypeface } from "./Brand";
import ProviderConnections from "../connectors/ProviderConnections";

const SIDEBAR_OPEN_STORAGE_KEY = "sidebar:isOpen";

const Sidebar = () => {
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
    if (stored !== null) {
      setIsOpen(stored === "true");
    } else if (window.innerWidth < 768) {
      setIsOpen(false);
    }
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
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={toggleOpen}
          aria-hidden="true"
        />
      )}
      <button
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Hide sidebar" : "Show sidebar"}
        title={isOpen ? "Hide sidebar" : "Show sidebar"}
        className={`fixed md:absolute top-4 z-50 md:z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-accent-foreground shadow-sm hover:bg-accent-hover transition-[left] duration-200 ${
          isOpen ? "left-60 md:left-auto md:-right-8" : "left-2 md:-right-8"
        }`}
      >
        {isOpen ? (
          <ChevronLeftIcon width={14} height={14} />
        ) : (
          <ChevronRightIcon width={14} height={14} />
        )}
      </button>
      <aside
        className={`fixed md:sticky top-0 left-0 h-full flex flex-col justify-between bg-accent-foreground border-r border-border shadow-sm transition-all duration-200 overflow-hidden z-40 md:z-2 ${
          isOpen
            ? "w-64 p-4 translate-x-0"
            : "w-64 p-4 -translate-x-full md:w-0 md:p-0 md:border-r-0 md:translate-x-0"
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
