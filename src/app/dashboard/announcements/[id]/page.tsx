"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter, useParams } from "next/navigation";
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

export default function AnnouncementDetailPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const announcementId = params.id as string;

  // Session & User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Announcement details & recent announcements sidebar state
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(false);

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

  // Fetch single announcement details
  const fetchAnnouncementDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/announcements/${announcementId}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data);
      } else {
        if (res.status === 404) {
          setAnnouncement(null);
        } else {
          showToast("Failed to retrieve announcement details.", "error");
        }
      }
    } catch (err) {
      console.error("Error retrieving announcement details:", err);
      showToast("Could not connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent announcements for sidebar
  const fetchRecent = async () => {
    setLoadingRecent(true);
    try {
      const res = await apiRequest("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setRecentAnnouncements(data || []);
      }
    } catch (err) {
      console.error("Error loading recent announcements:", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    if (announcementId) {
      fetchUser().then((user) => {
        if (user) {
          fetchAnnouncementDetail();
          fetchRecent();
        }
      });
    }
  }, [announcementId]);

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

  // Type styling details
  const getTypeConfig = (category: string) => {
    switch (category) {
      case "security":
        return {
          label: "Security Alert",
          bg: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/20",
          icon: "🛡️",
          themeColor: "text-red-500 dark:text-red-400",
        };
      case "maintenance":
        return {
          label: "Maintenance Alert",
          bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-450 border border-amber-250/20",
          icon: "🔧",
          themeColor: "text-amber-600 dark:text-amber-400",
        };
      case "event":
        return {
          label: "Community Event",
          bg: "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-200/20",
          icon: "📅",
          themeColor: "text-purple-500 dark:text-purple-400",
        };
      default:
        return {
          label: "General Notice",
          bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/20",
          icon: "📢",
          themeColor: "text-emerald-500 dark:text-emerald-450",
        };
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Loading details...</p>
      </div>
    );
  }

  const profile = currentUser.resident_profile;
  const announcementConfig = announcement ? getTypeConfig(announcement.category) : null;

  // Filter out current announcement from sidebar
  const sidebarAnnouncements = recentAnnouncements.filter(item => item.id !== announcementId).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-xs font-semibold max-w-sm animate-slide-in ${
          toast.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-450 border-emerald-200/30" 
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
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-5 shadow-sm">
            
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                Residency Status
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isVerified() ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="text-sm font-medium">
                  {isVerified() ? "Verified Resident" : "Pending Verification"}
                </span>
              </div>
            </div>

            <hr className="border-neutral-100 dark:border-zinc-800" />

            <nav className="flex flex-col gap-1 text-sm font-medium">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-all">
                🏠 Community Feed
              </Link>
              <Link href="/dashboard/announcements" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 transition-colors">
                📢 Announcements
              </Link>
              <Link href="/dashboard/news" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-all">
                📰 Orchard News
              </Link>
              <Link href="/dashboard/marketplace" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-all">
                🛍️ Marketplace
              </Link>
              <Link href="/dashboard/business-directory" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-all">
                🏢 Business Directory
              </Link>
              <Link href="/dashboard/phone-directory" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-all">
                📞 Phone Directory
              </Link>
            </nav>

            <hr className="border-neutral-100 dark:border-zinc-800" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-950/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-all active:scale-[0.99] cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Center Content / Main Column */}
        <main className="lg:col-span-6 space-y-6">
          
          {/* Breadcrumbs */}
          <div>
            <Link 
              href="/dashboard/announcements" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-450 hover:underline transition-colors"
            >
              ← Back to Community Board
            </Link>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-12 flex justify-center items-center shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 dark:text-zinc-400 font-light">Loading board notice...</span>
              </div>
            </div>
          ) : !announcement ? (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-12 text-center shadow-sm">
              <div className="text-4xl mb-3">📢</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notice Not Found</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto font-light">
                This announcement may have been suspended, removed, or is not published yet.
              </p>
              <Link 
                href="/dashboard/announcements" 
                className="inline-block mt-5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all"
              >
                Go to Community Board
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Full Notice Card */}
              <article className={`bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm p-6 md:p-8 space-y-6 relative overflow-hidden ${
                announcement.pinned 
                  ? "border-amber-400/80 dark:border-amber-500/60 bg-amber-50/10 dark:bg-amber-950/5" 
                  : "border-neutral-200/60 dark:border-zinc-800/80"
              }`}>
                {announcement.pinned && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />
                )}

                {/* Meta details */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${announcementConfig?.bg}`}>
                        {announcementConfig?.icon} {announcementConfig?.label}
                      </span>
                      {announcement.pinned && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md border border-amber-300/30">
                          📌 Pinned
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                      Published on {new Date(announcement.created_at).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
                    {announcement.title}
                  </h1>

                  <div className="text-xs text-slate-400 dark:text-zinc-500 font-light flex items-center gap-1.5 pt-1">
                    <span>👤 Published by: <strong>{announcement.author?.name || "Society Office"}</strong></span>
                  </div>
                </div>

                {announcement.image_url && (
                  <div className="relative w-full h-[250px] md:h-[400px] rounded-xl overflow-hidden mt-4 shadow-sm border border-neutral-200/40 dark:border-zinc-850 animate-fade-in">
                    <img 
                      src={announcement.image_url} 
                      alt={announcement.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                <hr className="border-neutral-100 dark:border-zinc-850" />

                {/* HTML content rendered safely */}
                <div 
                  className="prose dark:prose-invert max-w-none text-sm font-light text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: announcement.content }}
                />

              </article>
            </div>
          )}

        </main>

        {/* Right Sidebar Column */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
              Other Recent Notices
            </span>

            {loadingRecent ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sidebarAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-zinc-500 italic font-light py-2">
                No other recent notices.
              </p>
            ) : (
              <div className="space-y-3.5">
                {sidebarAnnouncements.map((item) => {
                  const config = getTypeConfig(item.category);
                  return (
                    <Link
                      key={item.id}
                      href={`/dashboard/announcements/${item.id}`}
                      className="block space-y-1 group border-l-2 hover:border-emerald-500 border-neutral-200 dark:border-zinc-850 pl-3 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-405 dark:text-zinc-500">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                        <span className={`text-[8px] font-bold px-1 rounded uppercase tracking-wide scale-90 ${config.bg}`}>
                          {config.icon}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-xs truncate group-hover:text-emerald-500 transition-colors">
                        {item.title}
                      </h4>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

    </div>
  );
}
