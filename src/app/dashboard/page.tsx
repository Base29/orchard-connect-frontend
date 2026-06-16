"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, checkEmailVerification, clearAuthToken } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import NavigationCard from "@/components/NavigationCard";
import RoleBadge from "@/components/RoleBadge";
import NotificationBell from "@/components/NotificationBell";

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
  roles?: string[];
}

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
}

interface News {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  comments_count: number;
  created_at: string;
  author?: {
    name: string;
  } | null;
}

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number;
}

interface Poll {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  status: "active" | "suspended" | "closed";
  created_at: string;
  votes_count: number;
  options: PollOption[];
  user_voted_option_id?: string | null;
  is_anonymous: boolean;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
    roles?: string[];
  };
}

interface UserStats {
  posts: {
    count: number;
    likes: number;
    comments: number;
  };
  polls: {
    count: number;
    votes: number;
  };
  ads: {
    count: number;
    active: number;
    sold: number;
  };
}

export default function DashboardPortalPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Core data states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [latestNews, setLatestNews] = useState<News | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);

  const [stats, setStats] = useState<UserStats>({
    posts: { count: 0, likes: 0, comments: 0 },
    polls: { count: 0, votes: 0 },
    ads: { count: 0, active: 0, sold: 0 }
  });

  // Micro-toast notification state
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

  // Fetch all dashboard portal data concurrently
  const fetchPortalData = async () => {
    try {
      const userRes = await apiRequest("/api/user");
      if (!userRes.ok) {
        router.push("/auth/login");
        return;
      }
      
      const userData = await userRes.json();
      setCurrentUser(userData.user);
      setIsLocked(userData.is_locked);

      // Redirect if no residency record is filled yet
      if (!userData.user?.resident_profile) {
        router.push("/auth/complete-profile");
        return;
      }

      // Concurrently fetch stats, listings, announcements, news, polls, and support tickets
      const [statsRes, listingsRes, announcementsRes, newsRes, pollsRes, supportTicketsRes] = await Promise.all([
        apiRequest("/api/user/stats"),
        apiRequest("/api/listings"),
        apiRequest("/api/announcements"),
        apiRequest("/api/news"),
        apiRequest("/api/polls"),
        apiRequest("/api/support/tickets"),
      ]);

      const [statsData, listingsData, announcementsData, newsData, pollsData, supportTicketsData] = await Promise.all([
        statsRes.ok ? statsRes.json() : null,
        listingsRes.ok ? listingsRes.json() : null,
        announcementsRes.ok ? announcementsRes.json() : null,
        newsRes.ok ? newsRes.json() : null,
        pollsRes.ok ? pollsRes.json() : null,
        supportTicketsRes.ok ? supportTicketsRes.json() : null,
      ]);

      if (statsData) {
        setStats(statsData);
      }

      if (listingsData) {
        setListings((listingsData.data || []).slice(0, 3));
      }

      if (announcementsData) {
        setAnnouncements(announcementsData || []);
      }

      if (newsData && newsData.data && newsData.data.length > 0) {
        setLatestNews(newsData.data[0]);
      }

      if (pollsData) {
        setPolls(pollsData.data || []);
      }

      if (supportTicketsData) {
        setSupportTickets(supportTicketsData);
      }

    } catch (err) {
      console.error("Dashboard portal fetching error:", err);
      showToast("Error connecting to server. Retrying...", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  // Track if user is signing in / visiting the dashboard for the first time
  useEffect(() => {
    if (currentUser) {
      const key = `visited_dashboard_${currentUser.id}`;
      const hasVisited = localStorage.getItem(key);
      if (!hasVisited) {
        setIsFirstTime(true);
        localStorage.setItem(key, "true");
      }
      setWelcomeLoaded(true);
    }
  }, [currentUser]);

  // WebSockets integration for real-time verification changes
  useEffect(() => {
    if (!currentUser) return;

    const echo = getEcho();
    if (!echo) return;

    const channelName = `user.${currentUser.id}`;
    
    echo.private(channelName)
      .listen(".ResidentVerificationStatusUpdated", (data: { status: "pending" | "approved" | "rejected"; rejection_reason?: string; rejection_message?: string }) => {
        console.log("WebSocket Reverb update received on dashboard portal:", data);
        
        if (data.status === "approved") {
          showToast("🎉 Congratulations! Your residency profile has been verified and approved!", "success");
        } else if (data.status === "rejected") {
          const reasonText = data.rejection_reason ? `Reason: ${data.rejection_reason.replace(/_/g, " ")}` : "Please review details.";
          showToast(`⚠️ Residency verification rejected. ${reasonText}`, "error");
        }

        fetchPortalData();
      });

    return () => {
      echo.leave(channelName);
    };
  }, [currentUser]);

  // Cast vote on poll from dashboard
  const handleCastVote = async (pollId: string, optionId: string) => {
    if (isVerified() === false) {
      showToast("Verification required to cast votes.", "error");
      return;
    }

    // Optimistically update locally
    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        return {
          ...p,
          user_voted_option_id: optionId,
          votes_count: p.votes_count + 1,
          options: p.options.map(o => o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o),
        };
      }
      return p;
    }));

    try {
      const res = await apiRequest(`/api/polls/${pollId}/vote`, {
        method: "POST",
        body: JSON.stringify({ poll_option_id: optionId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Sync with official response
        setPolls(prev => prev.map(p => p.id === pollId ? data : p));
        showToast("Vote registered successfully!", "success");
      } else {
        // Revert on failure
        fetchPortalData();
        const data = await res.json();
        showToast(data.message || "Failed to register vote.", "error");
      }
    } catch (err) {
      fetchPortalData();
      showToast("Network error registering vote.", "error");
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push("/");
  };

  const isVerified = (): boolean => {
    return currentUser?.email_verified_at !== null && 
      (currentUser?.resident_profile?.is_verified === true || currentUser?.resident_profile?.status === "approved");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const formatRejectionReason = (reason?: string) => {
    if (!reason) return "";
    return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const stripHtml = (html?: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, " ").trim();
  };

  const getActivePolls = () => {
    const now = new Date();
    return polls.filter(poll => {
      const start = new Date(poll.start_at);
      const end = new Date(poll.end_at);
      return poll.status === "active" && start <= now && end >= now;
    });
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Syncing community portal...</p>
      </div>
    );
  }

  const profile = currentUser.resident_profile;
  const pinnedAnnouncement = announcements.find(a => a.pinned);
  const announcementsPreview = announcements.slice(0, 3);
  const activePolls = getActivePolls().slice(0, 1); // Show up to 1 active poll on dashboard to match news height

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Floating Micro-Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-xs font-semibold max-w-sm animate-slide-in ${
          toast.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-250/30" 
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

      {/* Global verification status banners */}
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
                  <strong>Residency Profile Rejected</strong> (Reason: {formatRejectionReason(profile.rejection_reason)}). 
                  {profile.rejection_message && <span className="italic"> "{profile.rejection_message}"</span>}
                </>
              ) : (
                <>
                  <strong>Read-Only Guest State</strong> — Your proof documents are pending review. Interactions are restricted.
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
              Resident Dashboard
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
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold text-sm">
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
          
          {/* Navigation Card (Desktop Only) */}
          <NavigationCard currentUser={currentUser} activeKey="dashboard" variant="desktop" />

          {/* Announcements Widget in Left Sidebar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Society Board
              </span>
              <Link href="/dashboard/announcements" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline">
                View All
              </Link>
            </div>
            
            <div className="space-y-3 text-xs">
              {announcementsPreview.length === 0 ? (
                <div className="text-center text-xs py-4 text-slate-400 dark:text-zinc-400">
                  No notifications.
                </div>
              ) : (
                announcementsPreview.map((item) => (
                  <div key={item.id} className="space-y-0.5 border-l-2 border-emerald-500 pl-2">
                    <div className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Link href={`/dashboard/announcements/${item.id}`} className="hover:text-emerald-500 transition-colors line-clamp-1">
                        {item.title}
                      </Link>
                      {item.pinned && <span className="text-[8px] px-1 bg-amber-500/10 text-amber-600 rounded shrink-0">Pin</span>}
                    </div>
                    <p className="text-slate-500 dark:text-zinc-455 font-light text-[10px] leading-snug line-clamp-1">
                      {stripHtml(item.content)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Classified Ads Widget in Left Sidebar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Classified Ads
              </span>
              <Link href="/dashboard/marketplace" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline">
                Browse
              </Link>
            </div>

            <div className="space-y-3">
              {listings.length === 0 ? (
                <div className="text-center text-xs py-4 text-slate-400 dark:text-zinc-400">
                  No active listings.
                </div>
              ) : (
                listings.map((item) => (
                  <div key={item.id} className="rounded-xl border border-neutral-100 dark:border-zinc-850 p-3 space-y-1 text-xs hover:border-neutral-300 dark:hover:border-zinc-700 hover:bg-neutral-50/10 dark:hover:bg-zinc-950/10 transition-all">
                    <Link href={`/dashboard/marketplace/${item.id}`} className="block space-y-0.5 group">
                      <div className="font-bold text-emerald-600 dark:text-emerald-450 text-[11px]">
                        PKR {Number(item.price).toLocaleString('en-US')}
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-emerald-500 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 dark:text-zinc-500 truncate">{item.category}</p>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </aside>

        {/* Center / Dashboard Main Panel */}
        <main className="lg:col-span-9 space-y-8 order-1 lg:order-2">
          
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100/55 dark:border-emerald-950/40 bg-gradient-to-br from-emerald-50/50 via-teal-50/10 to-transparent dark:from-emerald-950/10 dark:via-zinc-900/10 dark:to-zinc-950 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 max-w-xl">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {!welcomeLoaded ? "Welcome" : (isFirstTime ? "Welcome" : "Welcome back")}, {currentUser.name.split(" ")[0]} 👋
              </h1>
              <p className="text-sm font-light leading-relaxed text-slate-500 dark:text-zinc-400">
                You have landed on your Orchard Connect portal dashboard. Stay updated with society matters, manage your ads, vote on polls, and engage with your neighbors.
              </p>
            </div>
            <Link 
              href="/dashboard/feed" 
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              Go to Community Feed →
            </Link>
          </div>

          {/* Navigation Card (Mobile Only) */}
          <NavigationCard currentUser={currentUser} activeKey="dashboard" variant="mobile" />


          {/* Pinned Announcement - Pinned underneath the welcome message */}
          {pinnedAnnouncement && (
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border-2 border-dashed border-amber-300/40 dark:border-amber-500/20 rounded-3xl p-6 space-y-3 relative overflow-hidden animate-fade-in shadow-sm">
              <div className="absolute right-4 top-4 text-3xl opacity-20 pointer-events-none font-bold">📌</div>
              
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Pinned Announcement
                </span>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-850 dark:text-neutral-100 hover:text-emerald-500 transition-colors">
                  <Link href={`/dashboard/announcements/${pinnedAnnouncement.id}`}>
                    {pinnedAnnouncement.title}
                  </Link>
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-350 font-light leading-relaxed line-clamp-3">
                  {stripHtml(pinnedAnnouncement.content)}
                </p>
              </div>
              
              <div className="pt-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline">
                <Link href={`/dashboard/announcements/${pinnedAnnouncement.id}`}>
                  Read Full Announcement →
                </Link>
              </div>
            </div>
          )}

          {/* Statistics Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Your Activity Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Feed activity stats card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-400">FEED CONTENT</span>
                  <span className="text-lg">💬</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black">{stats.posts.count}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-light">Posts published</div>
                </div>
                <div className="border-t border-neutral-100 dark:border-zinc-850 pt-3 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  <span className="flex items-center gap-1">❤️ {stats.posts.likes} <span className="font-light text-slate-400">Likes</span></span>
                  <span className="flex items-center gap-1">💬 {stats.posts.comments} <span className="font-light text-slate-400">Comments</span></span>
                </div>
              </div>

              {/* Poll activity stats card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-400">YOUR POLLS</span>
                  <span className="text-lg">📊</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black">{stats.polls.count}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-light">Polls proposed</div>
                </div>
                <div className="border-t border-neutral-100 dark:border-zinc-850 pt-3 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  <span>🗳️ {stats.polls.votes} <span className="font-light text-slate-400">Total votes cast</span></span>
                </div>
              </div>

              {/* Classified ads stats card */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-400">CLASSIFIED ADS</span>
                  <span className="text-lg">🛍️</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black">{stats.ads.count}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-light">Classified ads posted</div>
                </div>
                <div className="border-t border-neutral-100 dark:border-zinc-850 pt-3 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  <span className="flex items-center gap-1">🟢 {stats.ads.active} <span className="font-light text-slate-400">Active</span></span>
                  <span className="flex items-center gap-1">📦 {stats.ads.sold} <span className="font-light text-slate-400">Sold</span></span>
                </div>
              </div>

              {/* Support Tickets stats card */}
              <Link href="/dashboard/support" className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 shadow-sm flex flex-col justify-between cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors">SUPPORT TICKETS</span>
                  <span className="text-lg">🎫</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black">{supportTickets.length}</div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-light">Support tickets filed</div>
                </div>
                <div className="border-t border-neutral-100 dark:border-zinc-850 pt-3 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  <span className="flex items-center gap-1">⏱️ {supportTickets.filter((t: any) => t.status === "pending" || t.status === "open").length} <span className="font-light text-slate-400">Active</span></span>
                  <span className="flex items-center gap-1">✅ {supportTickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length} <span className="font-light text-slate-400">Resolved</span></span>
                </div>
              </Link>

            </div>
          </div>

          {/* Spotlights Section: Latest News & Active Polls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Column 1: Latest News Article */}
            <div className={`col-span-12 ${activePolls.length > 0 ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col`}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-4">
                Latest Orchard News
              </h2>
              {latestNews ? (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/60 dark:border-zinc-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col sm:flex-row gap-6 flex-1 relative overflow-hidden">
                  {latestNews.image_url && (
                    <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden shrink-0 border border-neutral-100 dark:border-zinc-850 relative bg-neutral-100 dark:bg-zinc-950">
                      <img 
                        src={latestNews.image_url} 
                        alt={latestNews.title} 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-zinc-500 font-medium">
                        <span>📰 ARTICLE</span>
                        <span>•</span>
                        <span>{new Date(latestNews.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        {latestNews.comments_count > 0 && (
                          <>
                            <span>•</span>
                            <span>💬 {latestNews.comments_count}</span>
                          </>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-neutral-150 group-hover:text-emerald-500 transition-colors line-clamp-2">
                        <Link href={`/dashboard/news/${latestNews.id}`}>
                          {latestNews.title}
                        </Link>
                      </h3>
                      
                      <p className="text-[11px] font-light text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {stripHtml(latestNews.content)}
                      </p>
                    </div>
                    
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline pt-1">
                      <Link href={`/dashboard/news/${latestNews.id}`}>
                        Read Article →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/60 dark:border-zinc-800/80 p-8 text-center shadow-sm flex-1 flex items-center justify-center">
                  <p className="text-slate-400 dark:text-zinc-500 text-xs italic font-light">No news articles found.</p>
                </div>
              )}
            </div>

            {/* Column 2: Active Community Polls with Direct Voting */}
            {activePolls.length > 0 && (
              <div className="col-span-12 lg:col-span-5 flex flex-col">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-4">
                  Active Community Polls
                </h2>
                <div className="space-y-6 flex-1 flex flex-col">
                  {activePolls.map((poll) => {
                    const totalVotes = poll.votes_count || 0;
                    const hasVoted = !!poll.user_voted_option_id;

                    return (
                      <div 
                        key={poll.id} 
                        className="bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/60 dark:border-zinc-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex-1 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 border border-emerald-500/15">
                              🗳️ Active Poll
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-zinc-550 flex items-center gap-1">
                              Proposed by {poll.user.name.split(" ")[0]}
                              <RoleBadge roles={poll.user.roles} />
                            </span>
                          </div>
                          <h3 className="text-xs font-extrabold text-slate-800 dark:text-neutral-100 hover:text-emerald-500 transition-colors line-clamp-2">
                            <Link href="/dashboard/polls">
                              {poll.title}
                            </Link>
                          </h3>
                          {poll.description && (
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-light line-clamp-1 leading-normal">
                              {poll.description}
                            </p>
                          )}
                        </div>

                        {/* Voting Options or Results Render */}
                        {hasVoted ? (
                          <div className="space-y-2.5 max-h-[85px] overflow-y-auto pr-1 mt-4">
                            {poll.options.map((option) => {
                              const optionVotes = option.votes_count || 0;
                              const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                              const isSelected = poll.user_voted_option_id === option.id;

                              return (
                                <div key={option.id} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-medium leading-none">
                                    <span className="flex items-center gap-1">
                                      <span className="truncate max-w-[170px]">{option.option_text}</span>
                                      {isSelected && <span className="text-[8px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 px-1 rounded border border-emerald-200/10">✓</span>}
                                    </span>
                                    <span className="text-slate-400 shrink-0">{percent}% ({optionVotes})</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${isSelected ? "bg-emerald-500" : "bg-slate-350 dark:bg-zinc-650"}`} 
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                            <div className="text-[8px] text-slate-400 dark:text-zinc-500 text-right">
                              Total votes cast: {totalVotes}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 mt-4">
                            {poll.options.map((option) => (
                              <button
                                key={option.id}
                                disabled={!isVerified()}
                                onClick={() => handleCastVote(poll.id, option.id)}
                                className="w-full text-left px-3.5 py-2 rounded-xl border border-neutral-150 dark:border-zinc-800/80 hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 text-[11px] font-semibold transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:hover:border-neutral-150 disabled:hover:bg-transparent disabled:active:scale-100"
                              >
                                {option.option_text}
                              </button>
                            ))}
                            {!isVerified() && (
                              <div className="text-[9px] text-amber-600 dark:text-amber-450 text-center italic font-light pt-1">
                                🔒 Verification required to vote.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Quick Access / Portal Features Grid */}
          <div className="space-y-4 mt-12 pt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Explore Platform Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Feed */}
              <Link href="/dashboard/feed" className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 shadow-sm">
                <div className="space-y-2">
                  <div className="text-xl">💬</div>
                  <h3 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">Community Feed</h3>
                  <p className="text-[11px] font-light text-slate-400 leading-relaxed line-clamp-2">Connect, share and discuss events with fellow residents.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 pt-2">
                  Open Feed <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>

              {/* Card 2: Announcements */}
              <Link href="/dashboard/announcements" className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 shadow-sm">
                <div className="space-y-2">
                  <div className="text-xl">📢</div>
                  <h3 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">Announcements</h3>
                  <p className="text-[11px] font-light text-slate-400 leading-relaxed line-clamp-2">Important society board notifications and administrative announcements.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 pt-2">
                  View Board <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>

              {/* Card 3: Orchard News */}
              <Link href="/dashboard/news" className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 shadow-sm">
                <div className="space-y-2">
                  <div className="text-xl">📰</div>
                  <h3 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">Orchard News</h3>
                  <p className="text-[11px] font-light text-slate-400 leading-relaxed line-clamp-2">Hyper-local updates, articles and newsletters about the neighborhood.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 pt-2">
                  Read Articles <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>

              {/* Card 4: Marketplace */}
              <Link href="/dashboard/marketplace" className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 shadow-sm">
                <div className="space-y-2">
                  <div className="text-xl">🛍️</div>
                  <h3 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">Classified Ads</h3>
                  <p className="text-[11px] font-light text-slate-400 leading-relaxed line-clamp-2">Buy and sell items within Orchard. Browse list or sell yours.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 pt-2">
                  Go to Marketplace <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>

              {/* Card 5: Business Directory */}
              <Link href="/dashboard/business-directory" className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 shadow-sm">
                <div className="space-y-2">
                  <div className="text-xl">🏢</div>
                  <h3 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">Business Directory</h3>
                  <p className="text-[11px] font-light text-slate-400 leading-relaxed line-clamp-2">Browse and review local verified shops, services, and vendors.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 pt-2">
                  Explore Directory <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>

              {/* Card 6: Phone Directory */}
              <Link href="/dashboard/phone-directory" className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 shadow-sm">
                <div className="space-y-2">
                  <div className="text-xl">📞</div>
                  <h3 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">Emergency Contacts</h3>
                  <p className="text-[11px] font-light text-slate-400 leading-relaxed line-clamp-2">Essential contacts for management, utility providers, and emergency services.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 pt-2">
                  View Contacts <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>

              {/* Card 7: Polls */}
              <Link href="/dashboard/polls" className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-44 shadow-sm md:col-span-2 lg:col-span-1">
                <div className="space-y-2">
                  <div className="text-xl">📊</div>
                  <h3 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">Polls & Voting</h3>
                  <p className="text-[11px] font-light text-slate-400 leading-relaxed line-clamp-2">Vote on local community choices and participate in neighborhood decisions.</p>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 pt-2">
                  Vote in Polls <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>

            </div>
          </div>

        </main>

      </div>
    </div>
  );
}
