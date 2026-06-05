"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const error = searchParams.get("error");

  // Tab mode state: Sign In vs Registration
  const [mode, setMode] = useState<"login" | "register">("login");

  // Inputs state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // Loading & error statuses
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const payload = mode === "login"
        ? { email, password }
        : { name, email, password, password_confirmation: passwordConfirmation };

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFormError(Object.values(data.errors).flat().join(" "));
        } else {
          setFormError(data.message || "Authentication failed. Please verify credentials.");
        }
        setLoading(false);
        return;
      }

      // Success: Save token to the auth_token cookie
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      document.cookie = `auth_token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax`;

      // Redirect depending on resident profile status
      if (data.profile_complete === true) {
        router.push("/dashboard");
      } else {
        router.push("/auth/complete-profile");
      }
    } catch (err) {
      console.error(err);
      setFormError("Connection refused. Make sure the backend server is active.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-8 space-y-6 shadow-sm">
      
      {/* Brand & Heading */}
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Orchard Connect
          </span>
        </div>
        <p className="text-sm font-light text-slate-500 dark:text-zinc-400">
          Enter the secure portal for Bahria Orchard residents.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-neutral-100 dark:border-zinc-850/80">
        <button
          type="button"
          onClick={() => { setMode("login"); setFormError(""); }}
          className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${mode === "login" ? "border-emerald-500 text-slate-900 dark:text-neutral-100" : "border-transparent text-slate-400 dark:text-zinc-400 hover:text-slate-700"}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode("register"); setFormError(""); }}
          className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${mode === "register" ? "border-emerald-500 text-slate-900 dark:text-neutral-100" : "border-transparent text-slate-400 dark:text-zinc-400 hover:text-slate-700"}`}
        >
          Create Account
        </button>
      </div>

      {/* Dynamic Alerts */}
      {error && !formError && (
        <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-900/20 border border-rose-200/40 text-rose-800 dark:text-rose-400 text-xs text-center font-medium animate-fadeIn">
          {error === "oauth_failed" && "OAuth authentication was rejected or expired."}
          {error === "account_suspended" && "Your resident account has been suspended by moderation."}
          {error === "invalid_callback" && "Authentication sequence aborted due to invalid callback payload."}
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-900/20 border border-rose-200/40 text-rose-800 dark:text-rose-400 text-xs text-center font-medium animate-fadeIn">
          {formError}
        </div>
      )}

      {/* OAuth Options */}
      <div className="space-y-2.5">
        <button
          onClick={() => window.location.href = "http://localhost:8080/api/auth/google/redirect"}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-neutral-50 dark:bg-zinc-800 text-slate-800 dark:text-neutral-100 border border-neutral-200/60 dark:border-zinc-800/80 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-zinc-700/50 active:scale-[0.99] transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Google Account
        </button>

        <button
          onClick={() => window.location.href = "http://localhost:8080/api/auth/facebook/redirect"}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-neutral-50 dark:bg-zinc-800 text-slate-800 dark:text-neutral-100 border border-neutral-200/60 dark:border-zinc-800/80 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-zinc-700/50 active:scale-[0.99] transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook Account
        </button>
      </div>

      <div className="relative flex items-center justify-center py-2">
        <div className="absolute w-full border-t border-neutral-100 dark:border-zinc-800/80" />
        <span className="relative px-3 text-xs bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-400 font-medium">
          Or secure credentials
        </span>
      </div>

      {/* Traditional credentials form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="space-y-1 animate-fadeIn">
            <label htmlFor="name" className="text-xs font-semibold text-slate-400 dark:text-zinc-400">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="e.g. Ahmad Khan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
            />
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-semibold text-slate-400 dark:text-zinc-400">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="e.g. name@orchard.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="pass" className="text-xs font-semibold text-slate-400 dark:text-zinc-400">
              Secret Password
            </label>
            {mode === "login" && (
              <a href="#" className="text-[10px] text-slate-400 dark:text-zinc-400 hover:underline">Forgot password?</a>
            )}
          </div>
          <input
            id="pass"
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-955 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
          />
        </div>

        {mode === "register" && (
          <div className="space-y-1 animate-fadeIn">
            <label htmlFor="passConfirm" className="text-xs font-semibold text-slate-400 dark:text-zinc-400">
              Confirm Password
            </label>
            <input
              id="passConfirm"
              type="password"
              required
              placeholder="••••••••••••"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
              {mode === "login" ? "Authenticating..." : "Creating Account..."}
            </>
          ) : (
            mode === "login" ? "Sign In" : "Register Address"
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-400 dark:text-zinc-400">
        {mode === "login" ? (
          <>
            New resident?{" "}
            <button
              type="button"
              onClick={() => { setMode("register"); setFormError(""); }}
              className="font-semibold text-slate-900 dark:text-neutral-100 hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("login"); setFormError(""); }}
              className="font-semibold text-slate-900 dark:text-neutral-100 hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              Sign In
            </button>
          </>
        )}
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-200">
      <Suspense fallback={
        <div className="text-sm font-light text-slate-400 dark:text-zinc-400">
          Loading login layout...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
