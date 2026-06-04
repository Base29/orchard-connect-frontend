"use client";

import React from "react";

export const dynamic = "force-dynamic";

/**
 * Root Error Boundary for Next.js App Router.
 * Replaces the entire root layout in case of fatal layout errors.
 * Explicitly defines HTML and body tags and operates independently of theme contexts.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 text-slate-900 font-sans">
        <div className="max-w-md space-y-4">
          <span className="text-4xl">⚠️</span>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight">Something went wrong</h2>
            <p className="text-xs font-light text-slate-500 leading-relaxed">
              An unexpected system error occurred while rendering the portal. 
              Please reload or contact Bahria society support.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
