"use client";

import { LoaderIcon, LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { Skeleton } from "../ui/Skeleton";

const LoginButton = () => {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-between" aria-label="Loading">
          <Skeleton className="bg-surface-hover h-5 w-2/3" hasOwnBg={false} />
          <Skeleton className="bg-surface-hover h-5 w-5" hasOwnBg={false} />
        </div>
      ) : session ? (
        <div className="flex items-start justify-between gap-2 whitespace-nowrap">
          <p className="text-sm">
            Hi, {session.user?.name?.trim().split(" ")[0]}!
          </p>{" "}
          <button onClick={() => signOut()}>
            <LogOut width={14} height={14} className="rotate-180" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn("google", { prompt: "select_account" })}
          className="bg-accent text-accent-foreground hover:bg-accent-hover rounded px-4 py-2"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default LoginButton;
