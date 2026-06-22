"use client";

import React, { useState } from "react";
import { apiRequest, User } from "@/lib/api";

interface PolicyAgreementModalProps {
  user: User | null;
}

export default function PolicyAgreementModal({ user }: PolicyAgreementModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Determine if the modal should be shown
  if (!user) return null;
  
  // Superadmins are exempt
  const isSuperAdmin = user.roles?.includes("superadmin");
  if (isSuperAdmin) return null;

  // If already accepted, do not show
  if (user.policies_accepted === true) return null;

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await apiRequest("/api/policies/accept", {
        method: "POST",
      });

      if (res.ok) {
        // Dispatch refresh event to update user session globally
        window.dispatchEvent(new CustomEvent("refresh-user-session"));
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Failed to submit policy agreement. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please make sure the backend is active and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-2xl animate-fadeIn my-auto">
        
        {/* Brand/Logo & Title */}
        <div className="space-y-2 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
            Action Required
          </span>
          <h2 className="text-xl font-extrabold tracking-tight">Review Platform Policies</h2>
          <p className="text-xs font-light text-slate-500 dark:text-zinc-400">
            To continue using Orchard Connect, all residents must agree to our community rules and platform guidelines.
          </p>
        </div>

        {/* Policies List Card */}
        <div className="space-y-3 bg-slate-50 dark:bg-zinc-950 p-5 rounded-xl border border-neutral-100 dark:border-zinc-800/60">
          <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
            Required Documents
          </div>
          
          <ul className="space-y-3">
            <li>
              <a 
                href="/terms" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors py-1 group"
              >
                <span>📄 Terms of Service</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 group-hover:underline">Read ↗</span>
              </a>
            </li>
            <li className="border-t border-neutral-150/40 dark:border-zinc-800/40 pt-2">
              <a 
                href="/privacy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors py-1 group"
              >
                <span>🔒 Privacy Policy</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 group-hover:underline">Read ↗</span>
              </a>
            </li>
            <li className="border-t border-neutral-150/40 dark:border-zinc-800/40 pt-2">
              <a 
                href="/data-deletion" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors py-1 group"
              >
                <span>🗑️ Data Deletion Policy</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 group-hover:underline">Read ↗</span>
              </a>
            </li>
            <li className="border-t border-neutral-150/40 dark:border-zinc-800/40 pt-2">
              <a 
                href="/guidelines" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors py-1 group"
              >
                <span>🤝 Community Rules & Guidelines</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 group-hover:underline">Read ↗</span>
              </a>
            </li>
            <li className="border-t border-neutral-150/40 dark:border-zinc-800/40 pt-2">
              <a 
                href="/disclaimer" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors py-1 group"
              >
                <span>⚠️ Disclaimer</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 group-hover:underline">Read ↗</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 dark:bg-rose-900/20 border border-rose-200/40 text-rose-800 dark:text-rose-450 text-xs text-center font-medium animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* Consent Checkbox */}
        <div className="flex items-start gap-3 bg-neutral-50/50 dark:bg-zinc-900 p-3 rounded-xl border border-neutral-100 dark:border-zinc-800/40">
          <input
            id="modalPoliciesAccepted"
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-neutral-200 dark:border-zinc-800 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
          />
          <label 
            htmlFor="modalPoliciesAccepted" 
            className="text-xs text-slate-600 dark:text-zinc-400 select-none cursor-pointer font-medium leading-relaxed"
          >
            I confirm that I have read and agree to all the platform policies listed above.
          </label>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAccept}
          disabled={loading || !accepted}
          className="w-full py-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              Accepting...
            </>
          ) : (
            "Agree and Continue"
          )}
        </button>

      </div>
    </div>
  );
}
