"use client";
import React, { useState, useEffect, useRef } from "react";
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
  resident_profile?: ResidentProfile | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "general" | "security" | "maintenance" | "event";
  status: string;
  pinned: boolean;
  created_at: string;
  image_url?: string | null;
  author?: {
    name: string;
  } | null;
}

const TYPE_FILTERS = [
  { value: "all", label: "All Announcements", icon: "📢" },
  { value: "general", label: "General", icon: "✉️" },
  { value: "security", label: "Security Alerts", icon: "🛡️" },
  { value: "maintenance", label: "Maintenance", icon: "🔧" },
  { value: "event", label: "Events", icon: "📅" },
];

export default function AnnouncementsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Session & User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Toast
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

  // Fetch Session User
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
      console.error("Auth Context error:", err);
      showToast("Session expired. Please sign in again.", "error");
      router.push("/auth/login");
      return null;
    }
  };

  // Fetch Announcements
  const fetchAnnouncementsList = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/announcements?paginate=true");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.data || []);
        setCurrentPage(data.current_page || 1);
        setNextPageUrl(data.next_page_url || null);
        setHasMore(!!data.next_page_url);
      } else {
        showToast("Failed to retrieve announcements.", "error");
      }
    } catch (err) {
      console.error("Error retrieving announcements:", err);
      showToast("Could not connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const user = await fetchUser();
      if (user) {
        await fetchAnnouncementsList();
      }
    };
    initialize();
  }, []);

  // Fetch older pages (Infinite Scroll)
  const fetchMoreAnnouncements = async () => {
    if (loadingMore || !nextPageUrl) return;

    setLoadingMore(true);
    try {
      let endpoint = nextPageUrl;
      if (nextPageUrl.startsWith("http://") || nextPageUrl.startsWith("https://")) {
        const url = new URL(nextPageUrl);
        endpoint = url.pathname + url.search;
      }

      // Keep the paginate flag in sub-requests
      if (!endpoint.includes("paginate=true")) {
        endpoint += (endpoint.includes("?") ? "&" : "?") + "paginate=true";
      }

      const res = await apiRequest(endpoint);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = (data.data || []).filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setCurrentPage(data.current_page);
        setNextPageUrl(data.next_page_url);
        setHasMore(!!data.next_page_url);
      }
    } catch (err) {
      console.error("Error fetching more announcements:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Scroll observer setup
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchMoreAnnouncements();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, nextPageUrl, loadingMore]);

  const isVerified = (): boolean => {
    return currentUser?.resident_profile?.is_verified === true || currentUser?.resident_profile?.status === "approved";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/");
  };

  // Helper to strip HTML tags for snippet preview
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>?/gm, " ").trim();
  };

  // Color mapping based on announcement type (category)
  const getTypeConfig = (category: string) => {
    switch (category) {
      case "security":
        return {
          label: "Security Alert",
          bg: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/20",
          icon: "🛡️",
          accentColor: "border-red-500",
        };
      case "maintenance":
        return {
          label: "Maintenance Alert",
          bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-450 border border-amber-250/20",
          icon: "🔧",
          accentColor: "border-amber-500",
        };
      case "event":
        return {
          label: "Community Event",
          bg: "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-200/20",
          icon: "📅",
          accentColor: "border-purple-500",
        };
      default:
        return {
          label: "General Notice",
          bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/20",
          icon: "📢",
          accentColor: "border-emerald-500",
        };
    }
  };

  // Filter list locally based on search query and type filter
  const filteredAnnouncements = announcements.filter(item => {
    // 1. Type filter
    if (selectedType !== "all" && item.category !== selectedType) {
      return false;
    }
    // 2. Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(query);
      const contentMatch = item.content.toLowerCase().includes(query);
      if (!titleMatch && !contentMatch) {
        return false;
      }
    }
    return true;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Syncing announcements...</p>
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
            ? "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border-rose-200/30"
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
      {!isVerified() && profile && (
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
                  <strong>Read-Only Guest State</strong> — Proof documents are pending review. Interactions are restricted.
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
              Community Board
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
          <NavigationCard currentUser={currentUser} activeKey="announcements" variant="desktop" />
        </aside>

        {/* Center Content */}
        <main className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Community Board</h1>
              <p className="text-xs font-light text-slate-400 dark:text-zinc-400">
                Society notices, emergencies, and administrative updates for Bahria Orchard residents.
              </p>
            </div>
          </div>

          <NavigationCard currentUser={currentUser} activeKey="announcements" variant="mobile" />

          {/* Search & Tabs Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search board by keyword, title, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
            </div>

            {/* Type tabs filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-neutral-100 dark:border-zinc-850 pt-4">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedType === t.value
                      ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                      : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-350 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Announcements List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 dark:text-zinc-400 font-light">Retrieving society board notices...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 py-20 text-center shadow-sm">
              <p className="text-slate-400 dark:text-zinc-400 text-sm font-light">
                No active announcements found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredAnnouncements.map((item) => {
                const config = getTypeConfig(item.category);
                return (
                  <div
                    key={item.id}
                    className={`group bg-white dark:bg-zinc-900 rounded-2xl border p-6 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                      item.pinned 
                        ? "border-amber-400/80 dark:border-amber-500/60 bg-amber-50/10 dark:bg-amber-950/5" 
                        : "border-neutral-200/60 dark:border-zinc-800/80 hover:border-neutral-350 dark:hover:border-zinc-700"
                    }`}
                  >
                    {/* Visual accent top highlight on pinned notices */}
                    {item.pinned && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />
                    )}

                    {/* Image block (Image or Placeholder) */}
                    <div className="relative w-full md:w-48 lg:w-60 h-40 md:h-auto min-h-[140px] bg-slate-50 dark:bg-zinc-950 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-neutral-100 dark:border-zinc-850">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="text-slate-400 dark:text-zinc-500 text-3xl select-none">
                          {config.icon}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        {/* Meta header bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${config.bg}`}>
                              {config.icon} {config.label}
                            </span>
                            {item.pinned && (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md border border-amber-300/30">
                                📌 Pinned
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-450 dark:text-zinc-550 font-normal">
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                        </div>

                        {/* Announcement Content details */}
                        <div className="space-y-1">
                          <Link href={`/dashboard/announcements/${item.id}`}>
                            <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-zinc-150 leading-tight group-hover:text-emerald-500 transition-colors cursor-pointer inline-block">
                              {item.title}
                            </h2>
                          </Link>
                          <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-3 whitespace-pre-wrap pt-2">
                            {stripHtml(item.content)}
                          </p>
                        </div>
                      </div>

                      {/* Footer author and navigation bar */}
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-zinc-850 mt-5 text-xs">
                        <span className="text-slate-400 dark:text-zinc-500 font-light flex items-center gap-1">
                          👤 Published by: <strong className="font-semibold text-slate-500 dark:text-zinc-450">{item.author?.name || "Society Office"}</strong>
                        </span>
                        <Link
                          href={`/dashboard/announcements/${item.id}`}
                          className="text-emerald-600 dark:text-emerald-450 font-bold hover:underline transition-all"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Infinite Scroll trigger target */}
              {hasMore && (
                <div ref={observerTarget} className="flex flex-col items-center justify-center py-6 gap-2">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-light text-slate-500 dark:text-zinc-400">Syncing older notices...</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
