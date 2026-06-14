"use client";

import React, { useState, useEffect } from "react";
import NavigationCard from "@/components/NavigationCard";
import NotificationBell from "@/components/NotificationBell";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface ResidentProfile {
  phase: string;
  block: string;
  house_number: string;
  street_number?: string;
  user_type: string;
  is_verified: boolean;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  rejection_message?: string;
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

interface ContactNumber {
  id: number;
  name: string;
  phone_number: string;
  description: string | null;
  category: string;
  order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  "All Numbers",
  "Emergency & Health",
  "Security",
  "Utilities",
  "Administration"
];

export default function PhoneDirectoryPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Authentication & Session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Phone Directory listings data
  const [contacts, setContacts] = useState<ContactNumber[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Numbers");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "info"
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // Email verification resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendStatus("idle");
    try {
      const res = await apiRequest("/api/email/verification-notification", {
        method: "POST",
      });
      if (res.ok) {
        setResendStatus("sent");
        showToast("Verification link sent successfully!", "success");
        setTimeout(() => setResendStatus("idle"), 5000);
      } else {
        setResendStatus("error");
        showToast("Failed to send verification link.", "error");
      }
    } catch (err) {
      setResendStatus("error");
      showToast("Network error. Please try again.", "error");
    } finally {
      setResendLoading(false);
    }
  };

  // Fetch Session Profile Context
  const fetchUser = async () => {
    try {
      const res = await apiRequest("/api/user");
      if (!res.ok) {
        router.push("/auth/login");
        return null;
      }
      const data = await res.json();
      setCurrentUser(data.user);
      setIsLocked(data.is_locked);

      if (!data.user?.resident_profile) {
        router.push("/auth/complete-profile");
        return null;
      }
      return data.user;
    } catch (err) {
      console.error("Session authentication error:", err);
      showToast("Session expired. Please sign in again.", "error");
      router.push("/auth/login");
      return null;
    }
  };

  // Fetch Phone Directory Contacts
  const fetchPhoneDirectory = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/phone-directory");
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      } else {
        // Handle 403 or other errors
        if (res.status === 403) {
          console.log("Access to phone directory is restricted to verified residents.");
        } else {
          showToast("Failed to retrieve phone directory.", "error");
        }
      }
    } catch (err) {
      console.error("Error retrieving phone directory data:", err);
      showToast("Could not connect to the directory server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const user = await fetchUser();
      if (user) {
        const profile = user.resident_profile;
        const verified = profile?.is_verified === true || profile?.status === "approved";
        if (verified) {
          await fetchPhoneDirectory();
        } else {
          setLoading(false);
        }
      }
    };
    initialize();
  }, []);

  const isVerified = (): boolean => {
    return currentUser?.email_verified_at !== null && 
      (currentUser?.resident_profile?.is_verified === true || currentUser?.resident_profile?.status === "approved");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/");
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (phone: string, id: number) => {
    navigator.clipboard.writeText(phone.replace(/\s+/g, ''));
    setCopiedId(id);
    showToast("Phone number copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Category & Search Filters Logic
  const filteredContacts = contacts.filter(contact => {
    // 1. Category Filter
    if (selectedCategory !== "All Numbers" && contact.category !== selectedCategory) {
      return false;
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = contact.name.toLowerCase().includes(query);
      const descMatch = contact.description?.toLowerCase().includes(query) ?? false;
      const phoneMatch = contact.phone_number.includes(query);
      
      if (!nameMatch && !descMatch && !phoneMatch) {
        return false;
      }
    }

    return true;
  });

  // Category styling color mappings
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "Emergency & Health":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border border-rose-200/20",
          icon: "🚨",
          badge: "bg-rose-500",
          gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
        };
      case "Security":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-450 border border-amber-200/20",
          icon: "🛡️",
          badge: "bg-amber-500",
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        };
      case "Utilities":
        return {
          bg: "bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-400 border border-sky-200/20",
          icon: "🔌",
          badge: "bg-sky-500",
          gradient: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
        };
      case "Administration":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/20",
          icon: "🏢",
          badge: "bg-emerald-500",
          gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
        };
      default:
        return {
          bg: "bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-neutral-200/40 dark:border-zinc-800",
          icon: "📞",
          badge: "bg-slate-500",
          gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
        };
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Syncing directory contacts...</p>
      </div>
    );
  }

  const profile = currentUser.resident_profile;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-xs font-semibold max-w-sm animate-slide-in ${
          toast.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200/30" 
            : toast.type === "error"
            ? "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border-rose-250/30"
            : "bg-white dark:bg-zinc-900 text-slate-800 dark:text-neutral-100 border-neutral-200/60 dark:border-zinc-800/80"
        }`}>
          <span>
            {toast.type === "success" && "✅"}
            {toast.type === "error" && "❌"}
            {toast.type === "info" && "ℹ️"}
          </span>
          <div className="flex-1">{toast.message}</div>
        </div>
      )}

      {/* Global verification status banner */}
      {!isVerified() && profile && currentUser?.email_verified_at !== null && (
        <div className={`w-full py-3.5 px-6 border-b text-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
          profile.status === "rejected" 
            ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-sm">
              {profile.status === "rejected" ? "⚠️" : "🔒"}
            </span>
            <p className="font-light">
              {profile.status === "rejected" ? (
                <>
                  <strong>Residency Profile Rejected</strong> (Reason: {profile.rejection_reason?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}). 
                  {profile.rejection_message && <span className="italic"> "{profile.rejection_message}"</span>}
                </>
              ) : (
                <>
                  <strong>Read-Only Guest State</strong> — Proof documents are pending review. Access to Phone Directory numbers is locked.
                </>
              )}
            </p>
          </div>
          {profile.status === "rejected" && (
            <button 
              onClick={() => router.push("/auth/complete-profile")}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-650 dark:hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Update & Resubmit
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Orchard Connect
            </span>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/30">
              Phone Directory
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell currentUser={currentUser} />

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme color"
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-all border border-transparent hover:border-neutral-200/50 dark:hover:border-zinc-800"
            >
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-neutral-200 dark:border-zinc-800">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-sm">
                {getInitials(currentUser.name)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold">{currentUser.name}</div>
                {profile && (
                  <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                    {profile.phase} • {profile.block}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <NavigationCard currentUser={currentUser} activeKey="phone-directory" variant="desktop" />
        </aside>

        {/* Center / Main Content */}
        <main className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          
          {/* Header Row */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Society Phone Directory</h1>
            <p className="text-xs font-light text-slate-400 dark:text-zinc-400">
              Instant access to security desks, medical facilities, utilities maintenance, and admin offices inside Bahria Orchard.
            </p>
          </div>

          <NavigationCard currentUser={currentUser} activeKey="phone-directory" variant="mobile" />

          {/* Gate check - show lock screen if not verified */}
          {!isVerified() ? (
            currentUser?.email_verified_at === null && (profile?.is_verified === true || profile?.status === "approved") ? (
              // Email Verification Required Lock Screen
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/25 rounded-full flex items-center justify-center text-3xl mx-auto text-rose-500 shadow-inner">
                  ✉️
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Email Verification Required</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto font-light leading-relaxed">
                    To access important society phone numbers, emergency lines, and utility dispatch contacts, you must first verify your email address.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleResendEmail}
                    disabled={resendLoading || resendStatus === "sent"}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 mx-auto"
                  >
                    {resendLoading && (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {resendStatus === "sent" ? "Link Resent" : "Resend Verification Email"}
                  </button>
                  {resendStatus === "sent" && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                      Please check your inbox (and spam folder) for the verification link.
                    </p>
                  )}
                  {resendStatus === "error" && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
                      Failed to send verification email. Please try again.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Residency Verification Required Lock Screen
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/25 rounded-full flex items-center justify-center text-3xl mx-auto text-amber-500 shadow-inner">
                  🔒
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Residency Verification Required</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto font-light leading-relaxed">
                    For the security, safety, and privacy of all residents in Bahria Orchard, access to important society phone numbers, emergency lines, and utility dispatch contacts is restricted to verified community members.
                  </p>
                </div>

                <div className="pt-2">
                  {profile?.status === "pending" ? (
                    <div className="inline-block px-5 py-2.5 bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-800 text-xs font-bold rounded-xl">
                      ⏳ Verification Request Pending Review
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push("/auth/complete-profile")}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      Complete Residency Profile
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            <>
              {/* Search & Category Filter Section */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm">
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search contacts by name, category, or descriptions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      🔍
                    </span>
                  </div>
                </div>

                {/* Category filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-neutral-100 dark:border-zinc-850 pt-4">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                        selectedCategory === category
                          ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                          : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-350 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contacts Loading State */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 dark:text-zinc-450 font-light">Loading verified contacts...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 py-20 text-center shadow-sm">
                  <p className="text-slate-400 dark:text-zinc-400 text-sm font-light">
                    No contacts found matching your search.
                  </p>
                </div>
              ) : (
                /* Grid of contacts */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredContacts.map((contact) => {
                    const cTheme = getCategoryTheme(contact.category);
                    return (
                      <div
                        key={contact.id}
                        className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 shadow-sm p-5 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-zinc-700 transition-all"
                      >
                        <div className="space-y-3">
                          {/* Card Header info */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${cTheme.bg}`}>
                                {contact.category}
                              </span>
                              <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm leading-snug group-hover:text-emerald-500 transition-colors">
                                {contact.name}
                              </h3>
                            </div>
                            
                            {/* Avatar fallback styled by category */}
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base shrink-0 shadow-sm"
                              style={{ background: cTheme.gradient }}
                            >
                              {cTheme.icon}
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed min-h-[36px]">
                            {contact.description || "Official community contact number."}
                          </p>
                        </div>

                        {/* Interactive contact buttons row */}
                        <div className="flex items-center gap-2 pt-4 border-t border-neutral-100 dark:border-zinc-850 mt-4 text-xs font-semibold">
                          <a
                            href={`tel:${contact.phone_number.replace(/\s+/g, '')}`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white font-bold transition-all active:scale-[0.98] shadow-sm text-center"
                          >
                            📞 Call: {contact.phone_number}
                          </a>
                          
                          <button
                            onClick={() => handleCopyToClipboard(contact.phone_number, contact.id)}
                            title="Copy number to clipboard"
                            className="p-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 hover:border-neutral-300 dark:hover:border-zinc-750 active:scale-90 transition-all cursor-pointer bg-transparent"
                          >
                            {copiedId === contact.id ? "✅" : "📋"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </main>
      </div>

    </div>
  );
}
