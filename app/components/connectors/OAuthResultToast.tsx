"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CONNECTOR_LIST } from "@/lib/connectors/public";

const PROVIDER_ERROR_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  oauth_denied: {
    title: "Connection cancelled",
    description: "You didn't grant access, so the account wasn't connected.",
  },
  missing_params: {
    title: "Connection failed",
    description: "Something went wrong during the connection. Try again.",
  },
  invalid_state: {
    title: "Connection failed",
    description: "The connection request expired. Try connecting again.",
  },
  account_in_use: {
    title: "Account already connected",
    description:
      "That account is already connected to a different Recall user.",
  },
};

const SESSION_ERROR_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  missing: {
    title: "Sign-in required",
    description: "Please sign in and try again.",
  },
  missing_email: {
    title: "Sign-in required",
    description: "Please sign in and try again.",
  },
  missing_user: {
    title: "Sign-in required",
    description: "Please sign in and try again.",
  },
};

const OAuthResultToast = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;

    const providerError = searchParams.get("provider_error");
    const sessionError = searchParams.get("session_error");
    const connected = searchParams.get("connected");

    if (!providerError && !sessionError && !connected) return;

    hasHandledRef.current = true;

    if (providerError) {
      const message = PROVIDER_ERROR_MESSAGES[providerError] ?? {
        title: "Connection failed",
        description: "Something went wrong. Try connecting again.",
      };
      toast.error(message.title, { description: message.description });
    } else if (sessionError) {
      const message = SESSION_ERROR_MESSAGES[sessionError] ?? {
        title: "Sign-in required",
        description: "Please sign in and try again.",
      };
      toast.error(message.title, { description: message.description });
    } else if (connected) {
      const label =
        CONNECTOR_LIST.find((provider) => provider.id === connected)?.label ??
        "Account";
      toast.success("Connected", { description: `${label} is now connected.` });
    }

    router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
};

export default OAuthResultToast;
