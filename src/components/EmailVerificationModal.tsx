"use client";

import React, { useState } from "react";
import { apiRequest } from "@/lib/api";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailVerificationModal({ isOpen, onClose }: EmailVerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleResend = async () => {
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await apiRequest("/api/email/verification-notification", {
        method: "POST",
      });

      if (res.ok) {
        setStatus("sent");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.message || "Failed to send verification link.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-6 shadow-2xl animate-scale-in text-center space-y-5">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors text-lg"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto text-xl">
          ✉️
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-800 dark:text-neutral-100">
            Email Verification Required
          </h3>
          <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
            To interact with the community feed, post classified advertisements, write reviews, or cast votes, you must first verify your email address.
          </p>
        </div>

        {/* Status Messaging */}
        {status === "sent" && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-400 font-medium leading-relaxed">
            ✅ Verification link has been resent! Please check your inbox (and spam folder) for the verification link.
          </div>
        )}

        {status === "error" && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-[11px] text-rose-800 dark:text-rose-400 font-medium leading-relaxed">
            ❌ {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleResend}
            disabled={loading || status === "sent"}
            className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            {status === "sent" ? "Link Resent" : "Resend Link"}
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-neutral-200 font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
