"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

export default function InviteInterceptionPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!code) return;

    async function validateInvite() {
      try {
        const response = await apiRequest(`/api/invitations/validate/${code}`);
        if (response.ok) {
          // Success: Save code to localStorage and redirect
          localStorage.setItem("orchard_invite_code", code);
          setTimeout(() => {
            router.push("/auth/login?mode=register");
          }, 1500);
        } else {
          const errData = await response.json();
          setErrorMsg(errData.message || "This invitation link is invalid or has expired.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error validating invitation:", err);
        setErrorMsg("Unable to connect to the verification system. Please try again later.");
        setLoading(false);
      }
    }

    validateInvite();
  }, [code, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6" />
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold tracking-tight">Verifying Security Signature</h2>
          <p className="text-sm font-light text-slate-500 dark:text-zinc-400">
            Reading encrypted community invitation link...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-200">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Invitation Expired or Invalid</h1>
            <p className="text-sm font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
              {errorMsg}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-neutral-105/40 dark:border-zinc-900 text-xs font-light text-slate-500 dark:text-zinc-400">
            Please contact the community administrator or the person who invited you to receive a new, valid invitation link.
          </div>

          <Link
            href="/auth/login"
            className="block w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-bold text-sm active:scale-[0.99] transition-all cursor-pointer"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 shadow-sm text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-2xl animate-bounce">
          🎉
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Invitation Accepted!</h1>
          <p className="text-sm font-light text-slate-500 dark:text-zinc-400">
            Preparing your resident profile and waiving verification document requirements...
          </p>
        </div>

        <p className="text-xs text-slate-400 dark:text-zinc-500">
          Redirecting to register page...
        </p>
      </div>
    </div>
  );
}
