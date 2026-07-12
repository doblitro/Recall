"use client";

import LoginButton from "../auth/LoginButton";
import { useSession } from "next-auth/react";
import { useSyncExternalStore } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { BrandTypeface } from "./Brand";
import ProviderConnections from "../connectors/ProviderConnections";

const SIDEBAR_OPEN_STORAGE_KEY = "sidebar:isOpen";
const sidebarListeners = new Set<() => void>();

function subscribeToSidebarOpen(callback: () => void) {
  sidebarListeners.add(callback);
  return () => sidebarListeners.delete(callback);
}

function getSidebarOpenSnapshot() {
  const stored = localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
  if (stored !== null) return stored === "true";
  return window.innerWidth >= 768;
}

function getSidebarOpenServerSnapshot() {
  return true;
}

function setSidebarOpen(value: boolean) {
  localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(value));
  sidebarListeners.forEach((listener) => listener());
}

const Sidebar = () => {
  const { status } = useSession();
  const isOpen = useSyncExternalStore(
    subscribeToSidebarOpen,
    getSidebarOpenSnapshot,
    getSidebarOpenServerSnapshot,
  );

  const toggleOpen = () => {
    setSidebarOpen(!isOpen);
  };

  if (status === "unauthenticated") {
    return (
      <div className="relative shrink-0">
        <aside
          className="bg-surface border-border sticky top-0 z-2 flex h-screen
            w-full flex-col justify-between border-r p-4 shadow-sm"
        >
          <div className="flex flex-col gap-4">
            <BrandTypeface showDescription />
            <LoginButton />
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="relative shrink-0 md:sticky md:top-0 md:h-dvh">
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={toggleOpen}
          aria-hidden="true"
        />
      )}
      {/* Collapse button */}
      <button
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Hide sidebar" : "Show sidebar"}
        title={isOpen ? "Hide sidebar" : "Show sidebar"}
        className={`border-border bg-surface hover:bg-accent-hover fixed top-4
          z-50 flex h-9 w-9 cursor-pointer items-center justify-center
          rounded-xl border shadow-sm transition-[left] duration-200 md:absolute
          md:z-10 ${
            isOpen ? "left-60 md:-right-5 md:left-auto" : "left-2 md:-right-8"
          }`}
      >
        {isOpen ? (
          <ChevronLeftIcon width={20} height={20} />
        ) : (
          <ChevronRightIcon width={20} height={20} />
        )}
      </button>

      <aside
        className={`bg-surface border-border fixed top-0 left-0 z-40 flex h-dvh
          flex-col justify-between overflow-hidden border-r shadow-sm
          transition-all duration-200 md:static md:z-2 md:h-full ${
            isOpen
              ? "w-64 translate-x-0"
              : "w-64 -translate-x-full md:w-0 md:translate-x-0 md:border-r-0"
          }`}
      >
        <div className="flex h-full w-full flex-col justify-between">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b p-4">
              <BrandTypeface compact />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ProviderConnections />
            </div>
          </div>
          <div className="border-t px-4 py-6">
            <LoginButton />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
