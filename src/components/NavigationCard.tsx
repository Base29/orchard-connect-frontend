"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ResidentProfile {
  phase: string;
  block: string;
  house_number: string;
  street_number?: string;
  user_type: string;
  is_verified: boolean;
  status: "pending" | "approved" | "rejected";
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: string;
  email_verified_at?: string | null;
  resident_profile?: ResidentProfile | null;
}

interface NavigationCardProps {
  currentUser: User;
  activeKey: "dashboard" | "feed" | "announcements" | "news" | "marketplace" | "business-directory" | "phone-directory" | "polls" | "support-tickets";
  variant: "mobile" | "desktop";
}

const links = [
  { href: "/dashboard", icon: "🎛️", label: "Dashboard", shortLabel: "Dashboard", key: "dashboard" },
  { href: "/dashboard/feed", icon: "💬", label: "Community Feed", shortLabel: "Feed", key: "feed" },
  { href: "/dashboard/announcements", icon: "📢", label: "Announcements", shortLabel: "Announcements", key: "announcements" },
  { href: "/dashboard/news", icon: "📰", label: "Orchard News", shortLabel: "News", key: "news" },
  { href: "/dashboard/marketplace", icon: "🛍️", label: "Marketplace", shortLabel: "Marketplace", key: "marketplace" },
  { href: "/dashboard/business-directory", icon: "🏢", label: "Business Directory", shortLabel: "Business", key: "business-directory" },
  { href: "/dashboard/phone-directory", icon: "📞", label: "Phone Directory", shortLabel: "Directory", key: "phone-directory" },
  { href: "/dashboard/polls", icon: "📊", label: "Polls", shortLabel: "Polls", key: "polls" },
  { href: "/dashboard/support", icon: "🎫", label: "Support Tickets", shortLabel: "Support", key: "support-tickets" },
];

export default function NavigationCard({ currentUser, activeKey, variant }: NavigationCardProps) {
  const router = useRouter();
  const profile = currentUser?.resident_profile;

  const isVerified = (): boolean => {
    return currentUser?.email_verified_at !== null && 
      (profile?.is_verified === true || profile?.status === "approved");
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/");
  };

  if (variant === "mobile") {
    return (
      <div className="block lg:hidden bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-5 shadow-sm">
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
            Residency Status
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isVerified() ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
            <span className="text-sm font-medium">
              {isVerified() ? "Verified Resident" : "Pending Verification"}
            </span>
          </div>
          {profile && (
            <div className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
              Registered under house {profile.house_number}, {profile.street_number ? `${profile.street_number}, ` : ""}{profile.phase} ({profile.block}).
            </div>
          )}
        </div>

        <hr className="border-neutral-100 dark:border-zinc-800" />

        <nav className="grid grid-cols-2 gap-2 text-xs font-medium">
          {links.map((link) => {
            const isSelected = activeKey === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  isSelected
                    ? "bg-neutral-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100"
                    : "hover:bg-neutral-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.shortLabel}</span>
              </Link>
            );
          })}
        </nav>

        <hr className="border-neutral-100 dark:border-zinc-800" />

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-rose-200/50 dark:border-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-all active:scale-[0.99] cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Desktop Card
  return (
    <div className="hidden lg:block bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-5 shadow-sm">
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
          Residency Status
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isVerified() ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
          <span className="text-sm font-medium">
            {isVerified() ? "Verified Resident" : "Pending Verification"}
          </span>
        </div>
        {profile && (
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
            Registered under house {profile.house_number}, {profile.street_number ? `${profile.street_number}, ` : ""}{profile.phase} ({profile.block}).
          </div>
        )}
      </div>

      <hr className="border-neutral-100 dark:border-zinc-800" />

      <nav className="flex flex-col gap-1 text-sm font-medium">
        {links.map((link) => {
          const isSelected = activeKey === link.key;
          return (
            <Link
              key={link.key}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isSelected
                  ? "bg-neutral-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100"
                  : "hover:bg-neutral-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <hr className="border-neutral-100 dark:border-zinc-800" />

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-all active:scale-[0.99] cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  );
}
