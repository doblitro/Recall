"use client";

import { signIn, signOut, useSession } from "next-auth/react";

const LoginButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2 whitespace-no-wrap">
        <p>{session.user?.name}</p>
        <button
          onClick={() => signOut()}
          className="rounded bg-danger px-4 py-2 text-danger-foreground hover:bg-danger-hover"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google", { prompt: "select_account" })}
      className="rounded bg-accent px-4 py-2 text-accent-foreground hover:bg-accent-hover"
    >
      Sign in with Google
    </button>
  );
};

export default LoginButton;
