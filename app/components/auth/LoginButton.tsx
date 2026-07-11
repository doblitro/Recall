"use client";

import { LoaderIcon, LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

const LoginButton = () => {
  const { data: session, status } = useSession();

  return (
    <div>
      {status === "loading" ? (
        <div className="flex items-center justify-center" aria-label="Loading">
          <LoaderIcon height={14} width={14} className="animate-spin" />
        </div>
      ) : session ? (
        <div className="flex justify-between gap-2 whitespace-nowrap">
          <p className="text-sm">{session.user?.name}</p>{" "}
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
