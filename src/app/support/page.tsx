"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { apiRequest, getAuthToken } from "@/lib/api";
import PolicyAgreementModal from "@/components/PolicyAgreementModal";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ContactSupportPage() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form states
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<{ tracking_id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if resident is authenticated
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoadingUser(false);
        return;
      }

      try {
        const res = await apiRequest("/api/user");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.log("Visitor is unauthenticated guest.");
      } finally {
        setLoadingUser(false);
      }
    };

    checkAuth();

    const handleRefreshUser = () => checkAuth();
    window.addEventListener("refresh-user-session", handleRefreshUser);

    return () => {
      window.removeEventListener("refresh-user-session", handleRefreshUser);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const payload: any = {
      category,
      subject,
      description,
    };

    if (!user) {
      payload.guest_name = guestName;
      payload.guest_email = guestEmail;
    }

    try {
      const res = await apiRequest("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedTicket(data);
      } else {
        const errData = await res.json();
        setSubmitError(errData.message || "Something went wrong. Please check inputs and try again.");
      }
    } catch (err) {
      setSubmitError("Failed to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (createdTicket) {
      navigator.clipboard.writeText(createdTicket.tracking_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Syncing secure gateway...</p>
      </div>
    );
  }

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
            {user ? (
              <Link href="/dashboard" className="text-xs hover:text-emerald-500 transition-colors font-medium">
                Portal Dashboard
              </Link>
            ) : (
              <Link href="/auth/login" className="text-xs hover:text-emerald-500 transition-colors font-medium">
                Sign In
              </Link>
            )}

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
        {!createdTicket ? (
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-850 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold tracking-tight">Contact support</h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                {user 
                  ? `Logged in as resident: ${user.name}. Your profile context will automatically link to this request.`
                  : "Submit your inquiry below. If you are an unregistered visitor, you will receive a tracking key to check status."
                }
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-600 dark:text-rose-455 text-xs font-semibold">
                ⚠️ {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Conditional Submitter fields */}
              {!user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Faisal Hussain"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-transparent focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="e.g. me@example.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-transparent focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Topic Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-emerald-500 focus:outline-none transition-all"
                >
                  <option value="general">General Inquiry</option>
                  <option value="auth_issue">Account & Verification Issues</option>
                  <option value="technical">Technical Platform Issues</option>
                  <option value="marketplace_dispute">Marketplace Dispute</option>
                  <option value="security">Security & Violation Report</option>
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summarize your request in a few words"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-transparent focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide all relevant details to help administration resolve your request..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-transparent focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Muted Privacy compliance notice */}
              {!user && (
                <p className="text-[9px] text-slate-400 dark:text-zinc-500 leading-normal italic font-light">
                  🔒 By submitting this form, you consent to transmission and processing of your name and email by society administrative staff for support verification purposes under standard local privacy regulations.
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Transmitting Inquiry...
                  </>
                ) : (
                  "Submit Support Ticket"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-850 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-center animate-fade-in">
            <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 text-2xl rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold tracking-tight">Ticket Submitted Successfully!</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                {user
                  ? "Your request has been successfully registered. You can track its status directly in your resident profile dashboard."
                  : `Your request has been registered. An email containing details was dispatched to your address. Please preserve the tracking reference token below to check progress.`
                }
              </p>
            </div>

            {/* Tracking ID widget */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-850/60 space-y-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550">
                Ticket Reference ID
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-lg font-bold text-slate-800 dark:text-neutral-100 tracking-wide">
                  {createdTicket.tracking_id}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-neutral-200/65 dark:bg-zinc-800/80 hover:bg-neutral-300/60 dark:hover:bg-zinc-700/60 text-[10px] font-semibold transition-all"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2.5">
              {!user && (
                <Link
                  href={`/support/track?id=${createdTicket.tracking_id}`}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center"
                >
                  Go to Tracking Screen →
                </Link>
              )}
              <Link
                href={user ? "/dashboard" : "/"}
                className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-900/50 text-xs font-semibold transition-all flex items-center justify-center"
              >
                {user ? "Return to Dashboard" : "Return to Home Page"}
              </Link>
            </div>
          </div>
        )}
      </main>
      <PolicyAgreementModal user={user as any} />
    </div>
  );
}
