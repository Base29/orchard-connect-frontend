"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken } from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const profileComplete = searchParams.get("profile_complete");

    if (token) {
      // 1. Write the token using our hybrid storage setter
      const remember = typeof window !== "undefined" && localStorage.getItem("oauth_remember_me") === "true";
      if (typeof window !== "undefined") {
        localStorage.removeItem("oauth_remember_me");
      }
      setAuthToken(token, remember);

      // 2. Conditional Redirect routing based on Resident Profile completion status
      if (profileComplete === "false") {
        router.push("/auth/complete-profile");
      } else {
        router.push("/dashboard");
      }
    } else {
      // Fallback: Return to login page if token is missing
      router.push("/auth/login?error=invalid_callback");
    }
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      {/* Pristine minimalist visual loading spinner */}
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Syncing Resident Credentials</h2>
        <p className="text-xs font-light text-slate-400 dark:text-zinc-500">
          Establishing a secure encrypted session on localhost...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
      <Suspense fallback={
        <div className="text-sm font-light text-slate-400 dark:text-zinc-500">
          Loading auth intercept gateway...
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
