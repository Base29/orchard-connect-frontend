"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface TicketDetails {
  tracking_id: string;
  status: "pending" | "open" | "resolved" | "closed";
  category: string;
  subject: string;
  resolution_notes?: string | null;
  created_at: string;
}

const CATEGORY_MAP: Record<string, string> = {
  general: "General Inquiry",
  auth_issue: "Account & Verification",
  technical: "Technical Support",
  marketplace_dispute: "Marketplace Dispute",
  security: "Security & Violations",
};

const STATUS_COLOR_MAP = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  open: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const STATUS_TEXT_MAP = {
  pending: "Pending Review",
  open: "Open / Under Investigation",
  resolved: "Resolved",
  closed: "Closed",
};

function TrackingContent() {
  const searchParams = useSearchParams();
  const trackingIdParam = searchParams.get("id") || "";

  // State
  const [trackingId, setTrackingId] = useState(trackingIdParam);
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const performSearch = async (targetId: string) => {
    if (!targetId.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setTicket(null);

    try {
      const res = await apiRequest(`/api/support/tickets/track/${targetId.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      } else {
        if (res.status === 404) {
          setSearchError("No support ticket found matching this reference ID. Please check and try again.");
        } else {
          setSearchError("An error occurred while retrieving ticket details.");
        }
      }
    } catch (err) {
      setSearchError("Network error. Please check your internet connection.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (trackingIdParam) {
      setTrackingId(trackingIdParam);
      performSearch(trackingIdParam);
    }
  }, [trackingIdParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(trackingId);
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-850 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-extrabold tracking-tight">Track Ticket Status</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-light max-w-sm mx-auto leading-relaxed">
            Enter your unique reference tracking ID (e.g. OC-TICK-XXXXX) below to view updates from administration.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="space-y-1">
            <input
              type="text"
              required
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="e.g. OC-TICK-AB12C"
              className="w-full text-center font-mono font-bold tracking-widest text-sm uppercase px-3 py-3 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-transparent focus:border-emerald-500 focus:outline-none transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-650"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !trackingId.trim()}
            className="w-full flex items-center justify-center py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                Querying Server...
              </>
            ) : (
              "Check Status"
            )}
          </button>
        </form>

        {searchError && (
          <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-600 dark:text-rose-455 text-xs text-center font-semibold">
            ⚠️ {searchError}
          </div>
        )}
      </div>

      {/* Ticket Details Render */}
      {ticket && (
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-850 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-850 pb-4">
            <div className="space-y-0.5">
              <span className="font-mono text-sm font-bold text-slate-800 dark:text-neutral-100">
                {ticket.tracking_id}
              </span>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                Submitted on {new Date(ticket.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>

            <span className={`px-3 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider ${STATUS_COLOR_MAP[ticket.status]}`}>
              {STATUS_TEXT_MAP[ticket.status]}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Subject & Category
              </span>
              <div className="font-bold text-slate-800 dark:text-neutral-100 text-sm">
                {ticket.subject}
              </div>
              <div className="text-slate-400 dark:text-zinc-400 font-light">
                Folder: {CATEGORY_MAP[ticket.category] || ticket.category}
              </div>
            </div>

            {/* Resolution Note Box */}
            {ticket.resolution_notes ? (
              <div className="p-5 rounded-2xl border border-emerald-500/15 dark:border-emerald-500/10 bg-emerald-500/[0.02] dark:bg-emerald-950/[0.02] space-y-2.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">
                  <span>📝</span>
                  <span>Final Resolution summary note</span>
                </div>
                <div 
                  className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300 font-light prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: ticket.resolution_notes }}
                />
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-950/20 text-center text-slate-400 dark:text-zinc-550 leading-relaxed font-light">
                ⏳ This ticket is currently being reviewed by community staff. As soon as a resolution note is published, it will appear here. No further actions are required.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackSupportTicketPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-150 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Orchard Connect
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full border border-neutral-200/40 dark:border-zinc-700/30">
              Support Engine
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs hover:text-emerald-500 transition-colors font-medium">
              Home
            </Link>
            <Link href="/support" className="text-xs hover:text-emerald-500 transition-colors font-medium">
              Submit Ticket
            </Link>

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme color"
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-all border border-transparent hover:border-neutral-200/50 dark:hover:border-zinc-800"
            >
              {theme === "light" ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-12 flex flex-col justify-center">
        <Suspense fallback={
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-850 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center p-6 transition-colors duration-200">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Loading tracking context...</p>
          </div>
        }>
          <TrackingContent />
        </Suspense>
      </main>
    </div>
  );
}
