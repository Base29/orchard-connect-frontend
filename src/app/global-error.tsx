"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-8 space-y-6 shadow-sm">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-sm font-light text-slate-500 dark:text-zinc-400">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
