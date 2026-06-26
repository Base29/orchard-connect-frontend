"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/api";

// Types for interactive simulator structures
interface Post {
  id: string;
  author: string;
  avatar: string;
  block: string;
  time: string;
  content: string;
  likes: number;
  liked: boolean;
  comments: Array<{ id: number; author: string; block: string; content: string }>;
  flags: number;
  media: string[];
}

interface Listing {
  id: string;
  title: string;
  price: string;
  block: string;
  category: string;
  seller: string;
  phone: string;
  image: string;
  comments: Array<{ id: number; author: string; content: string }>;
  flags: number;
}

interface DirectoryContact {
  name: string;
  number: string;
  category: string;
}

interface Review {
  id: string;
  business: string;
  author: string;
  rating: number;
  content: string;
  isSelf?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  target: string;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Active Explorer Tab
  const [activeTab, setActiveTab] = useState<"verification" | "feed" | "marketplace" | "directory_polls" | "realtime">("feed");

  // 1. Theme State Helper for icons
  const isDark = theme === "dark";

  // 2. Mock Stats (Live Counters)
  const [stats, setStats] = useState({
    residents: 1420,
    activeAds: 86,
    activePolls: 3,
    activeConnections: 312,
  });

  useEffect(() => {
    // Simulate minor background updates to make the counters feel alive
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        activeConnections: prev.activeConnections + (Math.random() > 0.5 ? 1 : -1),
        residents: prev.residents + (Math.random() > 0.95 ? 1 : 0),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3. Verification State
  const [verifStep, setVerifStep] = useState<"form" | "upload" | "status">("form");
  const [phase, setPhase] = useState("Phase 1");
  const [block, setBlock] = useState("Block G");
  const [houseNum, setHouseNum] = useState("254");
  const [streetNum, setStreetNum] = useState("12");
  const [userType, setUserType] = useState<"Owner" | "Tenant">("Owner");
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [verifStatus, setVerifStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectionsCount, setRejectionsCount] = useState(0);
  const [rejectReason, setRejectReason] = useState("Uploaded registry document scan is blurry and unreadable.");
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filename = e.target.files[0].name;
    setIsUploading(true);
    setTimeout(() => {
      setProofFile(filename);
      setIsUploading(false);
      setVerifStep("status");
    }, 1500);
  };

  const handleStatusChange = (status: "pending" | "approved" | "rejected") => {
    setVerifStatus(status);
    if (status === "rejected") {
      setRejectionsCount((prev) => Math.min(prev + 1, 5));
    }
  };

  // 4. Real-Time Community Feed State
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-1",
      author: "Usman Malik",
      avatar: "UM",
      block: "Phase 1 - Block C",
      time: "12m ago",
      content: "Are there any scheduled water maintenance shifts planned for Block C this afternoon? Water pressure is slightly lower than normal.",
      likes: 14,
      liked: false,
      comments: [
        { id: 101, author: "Ahmad Raza", block: "Phase 1 - Block G", content: "Yes, maintenance was posted on the community board. They are repairing a main line from 2 PM to 5 PM." },
        { id: 102, author: "Sarah Khan", block: "Phase 2 - Block D", content: "Pressure in Phase 2 seems fine, might just be restricted to Block C. Call the sewerage board." }
      ],
      flags: 0,
      media: ["🔑 Main Valve Repair", "💧 Low Pressure Flow"]
    },
    {
      id: "post-2",
      author: "Sarah Khan",
      avatar: "SK",
      block: "Phase 2 - Block D",
      time: "1h ago",
      content: "Found a lost key near the Block D central playground. It has a blue keychain. Let me know if you lost yours! 🌳 @all let's find the owner.",
      likes: 24,
      liked: false,
      comments: [],
      flags: 0,
      media: ["🔑 Key Found"]
    }
  ]);

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [mentionDropdown, setMentionDropdown] = useState<string | null>(null); // maps to post.id
  const [mentionFilter, setMentionFilter] = useState("");
  const neighbors = ["Ahmad Raza", "Sarah Khan", "Usman Malik", "all"];

  const handleCommentChange = (postId: string, val: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: val }));

    const atIndex = val.lastIndexOf("@");
    if (atIndex !== -1 && atIndex >= val.length - 15) {
      const query = val.substring(atIndex + 1);
      if (!query.includes(" ")) {
        setMentionDropdown(postId);
        setMentionFilter(query.toLowerCase());
      } else {
        setMentionDropdown(null);
      }
    } else {
      setMentionDropdown(null);
    }
  };

  const selectMention = (postId: string, name: string) => {
    const currentVal = commentInputs[postId] || "";
    const atIndex = currentVal.lastIndexOf("@");
    if (atIndex !== -1) {
      const newVal = currentVal.substring(0, atIndex) + `@${name.replace(" ", "_")} `;
      setCommentInputs((prev) => ({ ...prev, [postId]: newVal }));
    }
    setMentionDropdown(null);
  };

  const handlePostLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newLiked = !p.liked;
          return {
            ...p,
            liked: newLiked,
            likes: newLiked ? p.likes + 1 : p.likes - 1
          };
        }
        return p;
      })
    );
  };

  const handlePostCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId] || "";
    if (!text.trim()) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: Date.now(),
                author: "You (Verified Resident)",
                block: "Phase 1 - Block G",
                content: text.trim()
              }
            ]
          };
        }
        return p;
      })
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setMentionDropdown(null);
  };

  const handleFlagPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, flags: p.flags + 1 };
        }
        return p;
      })
    );
  };

  // 5. P2P Marketplace State
  const [marketplace, setMarketplace] = useState<Listing[]>([
    {
      id: "ad-1",
      title: "Prime 10 Marla Plot",
      price: "7,500,000 PKR",
      block: "Block G, Phase 1",
      category: "Real Estate",
      seller: "Usman Malik",
      phone: "923001234567",
      image: "🌄 10-Marla Plot Visuals",
      comments: [
        { id: 201, author: "Ahmad Raza", content: "Is the price negotiable?" },
        { id: 202, author: "Usman Malik", content: "Yes, slightly for serious cash buyers." }
      ],
      flags: 0
    },
    {
      id: "ad-2",
      title: "HP EliteBook 840 G8 Laptop",
      price: "85,000 PKR",
      block: "Block D, Phase 2",
      category: "Electronics",
      seller: "Sarah Khan",
      phone: "923001112223",
      image: "💻 Laptop Visuals",
      comments: [],
      flags: 0
    }
  ]);

  const [adCommentInputs, setAdCommentInputs] = useState<Record<string, string>>({});
  const [whatsappModal, setWhatsappModal] = useState<Listing | null>(null);

  const handleAdCommentSubmit = (adId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = adCommentInputs[adId] || "";
    if (!text.trim()) return;

    setMarketplace((prev) =>
      prev.map((ad) => {
        if (ad.id === adId) {
          return {
            ...ad,
            comments: [
              ...ad.comments,
              {
                id: Date.now(),
                author: "You (Verified)",
                content: text.trim()
              }
            ]
          };
        }
        return ad;
      })
    );
    setAdCommentInputs((prev) => ({ ...prev, [adId]: "" }));
  };

  const handleFlagAd = (adId: string) => {
    setMarketplace((prev) =>
      prev.map((ad) => {
        if (ad.id === adId) {
          return { ...ad, flags: ad.flags + 1 };
        }
        return ad;
      })
    );
  };

  // 6. Directories & Polls State
  const [scopedMode, setScopedMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const contacts: DirectoryContact[] = [
    { name: "Bahria Orchard Security Emergency", number: "042-3597-6001", category: "Emergency" },
    { name: "Fire Station (Bahria Head Office)", number: "042-111-999-888", category: "Emergency" },
    { name: "Sewerage & Water Maintenance Office", number: "042-3597-6211", category: "Utilities" },
    { name: "Orchard Medical Center & Pharmacy", number: "042-3597-6355", category: "Health" },
  ];

  // Business Reviews
  const [reviews, setReviews] = useState<Review[]>([
    { id: "rev-1", business: "Orchard Grocers", author: "Usman Malik", rating: 5, content: "Excellent service! They deliver fresh fruits to Block C in under 15 minutes." },
    { id: "rev-2", business: "Orchard Grocers", author: "You (Verified)", rating: 4, content: "Very reliable and well-stocked, but parking can be crowded in the evening.", isSelf: true }
  ]);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewStars, setNewReviewStars] = useState(5);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    setReviews([
      ...reviews,
      {
        id: `rev-${Date.now()}`,
        business: "Orchard Grocers",
        author: "You (Verified)",
        rating: newReviewStars,
        content: newReviewText.trim(),
        isSelf: true
      }
    ]);
    setNewReviewText("");
  };

  const handleDeleteReview = (id: string, isSelf: boolean) => {
    if (!isSelf) {
      setReviewError("Review Ownership Guard Active: You are not authorized to delete other residents' reviews.");
      setTimeout(() => setReviewError(null), 4000);
      return;
    }
    setReviews(reviews.filter((r) => r.id !== id));
  };

  // Poll
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({ yes: 48, no: 14, other: 6 });
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [anonymousPoll, setAnonymousPoll] = useState(false);
  const [pollSuspended, setPollSuspended] = useState(false);
  const votersList = {
    yes: ["Usman Malik", "Sarah Khan", "Ahmad Raza", "Bilal Siddique"],
    no: ["Zainab Bibi", "Hamza Javed"],
    other: ["Farhan Ali"]
  };

  const handleVote = (option: "yes" | "no" | "other") => {
    if (pollSuspended) return;
    if (votedOption) {
      // Toggle off or change vote
      const prevOpt = votedOption;
      if (prevOpt === option) {
        setPollVotes((prev) => ({ ...prev, [option]: prev[option] - 1 }));
        setVotedOption(null);
      } else {
        setPollVotes((prev) => ({
          ...prev,
          [prevOpt]: prev[prevOpt] - 1,
          [option]: prev[option] + 1
        }));
        setVotedOption(option);
      }
    } else {
      setPollVotes((prev) => ({ ...prev, [option]: prev[option] + 1 }));
      setVotedOption(option);
    }
  };

  // 7. Live Notification Simulator State
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "notif-1", title: "Review Deleted", message: "Your review on Orchard Grocers was updated successfully.", time: "10m ago", read: false, target: "reviews" },
    { id: "notif-2", title: "Mentions Alert", message: "Sarah Khan mentioned you in a discussion about park cleanliness.", time: "1h ago", read: true, target: "feed" }
  ]);
  const [notificationBellOpen, setNotificationBellOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<Notification | null>(null);
  const [isSimulatingEvent, setIsSimulatingEvent] = useState(false);

  const triggerMockWebSocketEvent = () => {
    setIsSimulatingEvent(true);
    setTimeout(() => {
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        title: "⚡ Real-Time Notification Event",
        message: "Sarah Khan commented on your community feed post: 'Count me in for water updates!'",
        time: "Just now",
        read: false,
        target: "feed"
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setToastMessage(newNotif);
      setIsSimulatingEvent(false);

      console.log("Real-time notification captured by secure connection listener.");
    }, 1200);
  };

  const markNotificationRead = (id: string, target: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setNotificationBellOpen(false);
    // Auto-scroll or jump to the tab simulating dynamic routing
    if (target === "feed") {
      setActiveTab("feed");
    } else if (target === "reviews") {
      setActiveTab("directory_polls");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* 1. Navbar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-zinc-900 bg-white/70 dark:bg-black/60 backdrop-blur-lg transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Orchard Connect
            </span>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100/50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/20">
              Bahria Orchard
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live connection indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Online Neighbors: {stats.activeConnections} active</span>
            </div>

            {/* Notification Bell with simulated dropdown */}
            <div className="sm:relative">
              <button
                onClick={() => setNotificationBellOpen(!notificationBellOpen)}
                className="relative p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-600 dark:text-zinc-400 transition-all active:scale-95 cursor-pointer"
                aria-label="Notifications tray"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown simulator */}
              {notificationBellOpen && (
                <div className="absolute right-4 left-4 sm:right-0 sm:left-auto top-full mt-3 w-auto sm:w-80 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-xl z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-900">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-505">
                      Notifications Hub
                    </span>
                    <button
                      onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="mt-2 max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-655">
                        No notifications. Try Simulator below!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id, n.target)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-zinc-900/50 ${n.read ? "border-slate-100 dark:border-zinc-900 opacity-60" : "border-emerald-500/20 dark:border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-950/10"}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">{n.title}</span>
                            <span className="text-[9px] text-slate-400 dark:text-zinc-505 flex-shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 line-clamp-2">{n.message}</p>
                          {!n.read && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 rounded text-[9px] font-bold">
                              New Real-Time Update
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400 transition-all active:scale-95 cursor-pointer"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Log In/Register Links */}
            <a
              href="/auth/login"
              className="text-xs font-semibold px-4.5 py-2.5 rounded-full border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors duration-200 cursor-pointer"
            >
              Log In
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 space-y-16">
        
        {/* Dynamic sliding Toast Notification for simulated event */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-emerald-500 bg-white dark:bg-zinc-950 p-4 shadow-2xl animate-slideIn">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                  Live Update Dispatched
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">{toastMessage.message}</p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setToastMessage(null);
                      setActiveTab("feed");
                    }}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    View Post Thread
                  </button>
                  <button
                    onClick={() => setToastMessage(null)}
                    className="text-[10px] text-slate-400 dark:text-zinc-505 font-bold hover:underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-center pt-4 lg:pt-10">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-500/20">
                🔒 Gated Neighbor Network
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black tracking-tight leading-none">
                Bahria Orchard’s <br />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                  Resident Hub
                </span>
              </h1>
              <p className="text-base sm:text-lg font-light text-slate-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                Experience a secure, hyper-local resident portal featuring instant timelines, local classified trade, private directories, and live notifications.
              </p>
            </div>

            {/* Quick stats panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl bg-white/50 dark:bg-zinc-900/20 border border-slate-200/60 dark:border-zinc-900 rounded-2xl p-4">
              <div>
                <span className="block text-2xl font-black text-slate-800 dark:text-zinc-100">{stats.residents}+</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555">Verified Neighbors</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-slate-800 dark:text-zinc-100">{stats.activeAds}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555">Active Ads</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-slate-800 dark:text-zinc-100">{stats.activePolls}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555">Running Polls</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-emerald-500 dark:text-emerald-400">100%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555">Privacy Gated</span>
              </div>
            </div>

            {/* Call to action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="/auth/login"
                className="flex items-center justify-center px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-neutral-100 font-bold rounded-full shadow-lg shadow-slate-950/10 active:scale-95 transition-all text-sm text-center cursor-pointer"
              >
                Register For Verification
              </a>
              <a
                href="#sandbox"
                className="flex items-center justify-center px-8 py-4 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900/50 font-bold rounded-full text-slate-700 dark:text-zinc-300 active:scale-95 transition-all text-sm text-center cursor-pointer"
              >
                Launch Feature Playground
              </a>
            </div>
          </div>

          {/* Hero Right Visuals */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-3xl blur-2xl opacity-15 dark:opacity-10 pointer-events-none" />
            <div className="relative rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/65 dark:bg-zinc-950/50 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-505">
                  🔒 Encrypted Resident Badge
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Verified Phase 1
                </span>
              </div>

              {/* High Fidelity Resident Card Visualizer */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                  UM
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-zinc-100">Usman Malik</h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-505">Owner • Block C, Street 4, House 112</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/15 text-blue-500 uppercase tracking-wider">
                      Resident
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-500/15 text-purple-500 uppercase tracking-wider">
                      Verified Block C
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-900/80 p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-900 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 dark:text-zinc-505 font-medium">Verify Status</span>
                  <span className="px-2 py-0.5 rounded-full font-extrabold text-[10px] bg-emerald-500/10 text-emerald-500">
                    APPROVED
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 dark:text-zinc-505 font-medium">Signed Document Link</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-tight max-w-[150px] truncate select-none">
                    secure://resident-vault/expiring-signed-url-access
                  </span>
                </div>
                <div className="border-t border-slate-100 dark:border-zinc-900 pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-505">Rejections Guard Count</span>
                  <span className="font-mono text-xs text-slate-800 dark:text-zinc-300">0 / 5 attempts</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Interactive Features Playground Dashboard */}
        <section id="sandbox" className="space-y-8 pt-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Interactive Feature Explorer
            </h2>
            <p className="text-sm font-light text-slate-600 dark:text-zinc-400 leading-relaxed">
              Explore how our hyper-local features operate. Click tabs to cycle through residency verification, live feeds, WhatsApp routing marketplaces, scoped directories, and real-time notifications.
            </p>
          </div>

          {/* Vertical/Horizontal Tab bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200/60 dark:border-zinc-900 pb-4">
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${activeTab === "feed" ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md" : "border border-slate-200/60 dark:border-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400"}`}
            >
              <span>💬</span> Community Feed
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${activeTab === "verification" ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md" : "border border-slate-200/60 dark:border-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400"}`}
            >
              <span>🛡️</span> Residency Verification
            </button>
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${activeTab === "marketplace" ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md" : "border border-slate-200/60 dark:border-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400"}`}
            >
              <span>🛍️</span> P2P Marketplace
            </button>
            <button
              onClick={() => setActiveTab("directory_polls")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${activeTab === "directory_polls" ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md" : "border border-slate-200/60 dark:border-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400"}`}
            >
              <span>📞</span> Directory & Polls
            </button>
            <button
              onClick={() => setActiveTab("realtime")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${activeTab === "realtime" ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-md" : "border border-slate-200/60 dark:border-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400"}`}
            >
              <span>⚡</span> Real-time Sandbox
            </button>
          </div>

          {/* Playground Content Area */}
          <div className="min-h-[500px] rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-md p-6 shadow-md transition-all duration-300">
            
            {/* TAB 1: SOCIAL FEED */}
            {activeTab === "feed" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-900">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Verified Real-Time Timeline</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-505">Updates sync in real-time. Experience `@mentions` autocomplete and flag auto-moderation.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/25 self-start md:self-auto">
                    Live Timeline Simulation
                  </span>
                </div>

                {/* Feed posts list */}
                <div className="space-y-6 max-w-4xl mx-auto">
                  {posts.map((post) => {
                    const isModerated = post.flags >= 5;

                    return (
                      <div
                        key={post.id}
                        className={`rounded-2xl border p-5 space-y-4 transition-all ${isModerated ? "bg-red-500/5 border-red-500/30 opacity-70" : "bg-white dark:bg-zinc-950 border-slate-200/80 dark:border-zinc-900/80"}`}
                      >
                        {/* Header details */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm">
                              {post.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-sm font-semibold">
                                {post.author}
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400 border border-slate-200/20">
                                  {post.block}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-505">{post.time}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 dark:text-zinc-505">{post.flags} flags</span>
                            {!isModerated && (
                              <button
                                onClick={() => handleFlagPost(post.id)}
                                className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
                              >
                                Flag Content
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsed content if flagged >= 5 */}
                        {isModerated ? (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                            <span>⚠️</span>
                            <span>This post has been auto-moderated and hidden. It exceeded the community flagging threshold of 5 flags.</span>
                          </div>
                        ) : (
                          <>
                            {/* Content body */}
                            <p className="text-sm text-slate-700 dark:text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
                              {post.content}
                            </p>

                            {/* Attachments preview */}
                            {post.media.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {post.media.map((med, idx) => (
                                  <div
                                    key={idx}
                                    className="aspect-video bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/40 dark:border-zinc-800/80 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-zinc-400 font-bold select-none p-2 text-center"
                                  >
                                    <span>📷 Attachment {idx + 1}</span>
                                    <span className="text-[10px] font-normal text-slate-400 dark:text-zinc-555 mt-1">{med}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Likes & comment counter */}
                            <div className="flex items-center gap-4 text-xs select-none border-t border-slate-100 dark:border-zinc-900 pt-3">
                              <button
                                onClick={() => handlePostLike(post.id)}
                                className={`flex items-center gap-1.5 font-bold transition-all active:scale-95 cursor-pointer ${post.liked ? "text-rose-500 scale-105" : "text-slate-400 dark:text-zinc-505 hover:text-slate-600 dark:hover:text-zinc-400"}`}
                              >
                                <svg className="w-4.5 h-4.5" fill={post.liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{post.likes} Likes</span>
                              </button>

                              <span className="text-slate-400 dark:text-zinc-505 flex items-center gap-1.5">
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>{post.comments.length} Comments</span>
                              </span>
                            </div>

                            {/* Threaded Comments */}
                            {post.comments.length > 0 && (
                              <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/60 space-y-3">
                                {post.comments.map((comm) => (
                                  <div key={comm.id} className="text-xs space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{comm.author}</span>
                                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-200/50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 rounded">
                                        {comm.block}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-zinc-400 font-light leading-relaxed">{comm.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input Form with Autocomplete */}
                            <form onSubmit={(e) => handlePostCommentSubmit(post.id, e)} className="relative pt-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={commentInputs[post.id] || ""}
                                  onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                  placeholder="Write a reply... (Type @ to mention neighbors)"
                                  className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
                                />
                                <button
                                  type="submit"
                                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-100 active:scale-95 transition-all shadow-sm cursor-pointer"
                                >
                                  Submit
                                </button>
                              </div>

                              {/* Autocomplete Mentions Dropdown */}
                              {mentionDropdown === post.id && (
                                <div className="absolute left-0 bottom-12 w-56 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 p-2 space-y-1">
                                  <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-555 font-bold px-2 py-1">
                                    Resident Autocomplete
                                  </div>
                                  {neighbors
                                    .filter((n) => n.toLowerCase().includes(mentionFilter))
                                    .map((n) => (
                                      <button
                                        key={n}
                                        type="button"
                                        onClick={() => selectMention(post.id, n)}
                                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-zinc-900/60 font-medium text-slate-700 dark:text-zinc-300 flex items-center justify-between cursor-pointer"
                                      >
                                        <span>@{n.replace(" ", "_")}</span>
                                        <span className="text-[9px] text-slate-400 dark:text-zinc-505">
                                          {n === "all" ? "Broadcast Alert" : "Phase 1 Resident"}
                                        </span>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </form>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: RESIDENCY VERIFICATION */}
            {activeTab === "verification" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-900">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Residency Verification Pipeline</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-505">Simulate how neighbors submit localized credentials and how the life cycle handles verification requests.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVerifStep("form")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${verifStep === "form" ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400"} cursor-pointer`}
                    >
                      1. Address Info
                    </button>
                    <button
                      onClick={() => setVerifStep("upload")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${verifStep === "upload" ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400"} cursor-pointer`}
                    >
                      2. Proof Files
                    </button>
                    <button
                      onClick={() => setVerifStep("status")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${verifStep === "status" ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400"} cursor-pointer`}
                    >
                      3. State Cycle
                    </button>
                  </div>
                </div>

                <div className="max-w-xl mx-auto border border-slate-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-6 rounded-2xl space-y-6">
                  {/* Step 1: Address parameters */}
                  {verifStep === "form" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-zinc-200">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">1</span>
                        <span>Submit Living Parameters</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555 mb-1.5">Phase</label>
                          <select
                            value={phase}
                            onChange={(e) => setPhase(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:outline-none"
                          >
                            <option>Phase 1</option>
                            <option>Phase 2</option>
                            <option>Phase 3</option>
                            <option>Phase 4</option>
                            <option>Phase 5</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555 mb-1.5">Block</label>
                          <select
                            value={block}
                            onChange={(e) => setBlock(e.target.value)}
                            className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:outline-none"
                          >
                            <option>Block A</option>
                            <option>Block B</option>
                            <option>Block C</option>
                            <option>Block G</option>
                            <option>Block D</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555 mb-1.5">House Number</label>
                          <input
                            type="text"
                            value={houseNum}
                            onChange={(e) => setHouseNum(e.target.value)}
                            placeholder="House #"
                            className="w-full text-xs px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555 mb-1.5">Street Number</label>
                          <input
                            type="text"
                            value={streetNum}
                            onChange={(e) => setStreetNum(e.target.value)}
                            placeholder="Street #"
                            className="w-full text-xs px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555 mb-1.5">Living Arrangement</label>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setUserType("Owner")}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${userType === "Owner" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"} cursor-pointer`}
                          >
                            Owner
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserType("Tenant")}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl border ${userType === "Tenant" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"} cursor-pointer`}
                          >
                            Tenant
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setVerifStep("upload")}
                        className="w-full py-3 mt-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-100 font-bold text-xs uppercase transition-all duration-200 cursor-pointer"
                      >
                        Next: Upload Proof
                      </button>
                    </div>
                  )}

                  {/* Step 2: Proof Upload */}
                  {verifStep === "upload" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-zinc-200">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">2</span>
                        <span>Submit Verification Document</span>
                      </div>

                      <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 rounded-2xl p-8 text-center transition-colors relative cursor-pointer">
                        <input
                          type="file"
                          id="mock-file-upload"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleSimulateUpload}
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <div className="space-y-3">
                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Uploading securely...</p>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-505">Encrypting document stream via TLS</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <span className="block text-2xl">📄</span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Drag & drop Electricity Bill or Maintenance Bill here</p>
                            <span className="block text-[10px] text-slate-400 dark:text-zinc-500">PDF, PNG, JPG, or JPEG accepted. Note: This document will be permanently deleted once your residency status is approved or rejected.</span>
                          </div>
                        )}
                      </div>

                      {proofFile && (
                        <div className="flex items-center justify-between p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500">✓</span>
                            <span className="font-semibold text-slate-800 dark:text-zinc-300">{proofFile}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-555">Ready for review</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setVerifStep("form")}
                          className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 font-bold text-xs uppercase cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setVerifStep("status")}
                          className="flex-1 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-100 font-bold text-xs uppercase cursor-pointer"
                        >
                          View Review Queue
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Lifecycle status & guard locks */}
                  {verifStep === "status" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-zinc-200">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs">3</span>
                        <span>Verification Lifecycle States</span>
                      </div>

                      {/* Simulated Selector */}
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-555 mb-2">Simulate Moderator Response:</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleStatusChange("pending")}
                            className={`py-2 rounded-xl text-xs font-semibold border ${verifStatus === "pending" ? "border-amber-500 bg-amber-500/10 text-amber-500" : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"} cursor-pointer`}
                          >
                            Pending Review
                          </button>
                          <button
                            onClick={() => handleStatusChange("approved")}
                            className={`py-2 rounded-xl text-xs font-semibold border ${verifStatus === "approved" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"} cursor-pointer`}
                          >
                            Approve Profile
                          </button>
                          <button
                            onClick={() => handleStatusChange("rejected")}
                            disabled={rejectionsCount >= 5}
                            className={`py-2 rounded-xl text-xs font-semibold border ${verifStatus === "rejected" ? "border-rose-500 bg-rose-500/10 text-rose-500" : "border-slate-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-zinc-900"} disabled:opacity-30 cursor-pointer`}
                          >
                            Reject Document
                          </button>
                        </div>
                      </div>

                      {/* Active Status Presentation Card */}
                      <div className="p-5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-900 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 dark:text-zinc-505 font-medium">Resident Target:</span>
                          <span className="font-extrabold text-[10px] bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-800 dark:text-zinc-200">
                            {phase} • {block} • House {houseNum}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-zinc-800/80 pt-3">
                          <span className="text-xs text-slate-400 dark:text-zinc-555 font-medium">Current Status:</span>
                          {verifStatus === "pending" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/15 text-amber-500">
                              PENDING REVIEW
                            </span>
                          )}
                          {verifStatus === "approved" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-500">
                              APPROVED & VERIFIED
                            </span>
                          )}
                          {verifStatus === "rejected" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-500/15 text-rose-500">
                              REJECTED / DENIED
                            </span>
                          )}
                        </div>

                        {/* Status Description Box */}
                        {verifStatus === "pending" && (
                          <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed pt-2">
                            The document has been securely loaded. System administrators have been notified to inspect block/street matching parameters.
                          </p>
                        )}
                        {verifStatus === "approved" && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-zinc-800/80">
                            <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
                              Verified permissions unlocked! You are assigned resident level access permissions. Expiring URL keys secure your private attachments.
                            </p>
                            <span className="inline-block text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              Access Granted • Resident Credentials Synced
                            </span>
                          </div>
                        )}
                        {verifStatus === "rejected" && (
                          <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-zinc-800/80">
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                              <span className="block text-[9px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Rejection Reason:</span>
                              <p className="text-xs text-rose-700 dark:text-rose-400">{rejectReason}</p>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-zinc-555 font-medium">
                              <span>Rolling Rejection Guard Alert:</span>
                              <span className="text-rose-500 font-bold">{rejectionsCount} / 5 fails</span>
                            </div>
                            {rejectionsCount >= 5 && (
                              <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-xl text-xs text-red-600 font-bold">
                                🛑 ACCOUNT LOCKED. Multiple consecutive rejections detected. Further submissions require staff override.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: P2P MARKETPLACE */}
            {activeTab === "marketplace" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-900">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Localized Classified Ads</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-555">Explore listings and test our secure WhatsApp routing mechanism alongside inline comments.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 self-start md:self-auto">
                    Phase-Scoped Listings
                  </span>
                </div>

                {/* Ads grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {marketplace.map((ad) => {
                    const isModerated = ad.flags >= 5;

                    return (
                      <div
                        key={ad.id}
                        className={`rounded-2xl border p-5 space-y-4 bg-white dark:bg-zinc-950 transition-all ${isModerated ? "bg-red-500/5 border-red-500/30 opacity-70" : "border-slate-200/80 dark:border-zinc-900"}`}
                      >
                        {/* Image display */}
                        <div className="aspect-[16/10] bg-slate-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-655 font-bold border border-slate-200/40 dark:border-zinc-800 relative select-none">
                          <span className="text-sm">{ad.image}</span>
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500 text-white">
                            {ad.category}
                          </span>
                        </div>

                        {/* Title and details */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="block text-emerald-600 dark:text-emerald-400 font-black text-sm">{ad.price}</span>
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 mt-0.5">{ad.title}</h4>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-505 mt-1">
                              Seller: {ad.seller} • Located: {ad.block}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-400 dark:text-zinc-505">{ad.flags} flags</span>
                            {!isModerated && (
                              <button
                                onClick={() => handleFlagAd(ad.id)}
                                className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-500/10 text-red-500 hover:bg-red-500/25 active:scale-95 transition-all cursor-pointer"
                              >
                                Flag
                              </button>
                            )}
                          </div>
                        </div>

                        {isModerated ? (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-600 dark:text-red-400 font-medium">
                            ⚠️ This listing has been auto-moderated and hidden. It exceeded 5 community flags.
                          </div>
                        ) : (
                          <>
                            {/* WhatsApp button */}
                            <button
                              onClick={() => setWhatsappModal(ad)}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all active:scale-[0.98] shadow-sm shadow-[#25D366]/20 cursor-pointer"
                            >
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.09-3.79c1.624.966 3.23 1.488 4.96 1.489 5.485 0 9.948-4.467 9.95-9.95.002-2.658-1.03-5.155-2.906-7.03C16.324 2.847 13.827 1.815 11.99 1.815c-5.495 0-9.959 4.467-9.962 9.953-.001 1.76.47 3.479 1.365 5.01L2.348 21.65l4.8-.84z" />
                              </svg>
                              <span>Secure WhatsApp Routing</span>
                            </button>

                            {/* Inline Comments */}
                            <div className="border-t border-slate-100 dark:border-zinc-900 pt-3 space-y-2">
                              <span className="block text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">
                                Listing Discussion
                              </span>
                              {ad.comments.length > 0 && (
                                <div className="space-y-2 bg-slate-50 dark:bg-zinc-900/40 p-3 rounded-xl">
                                  {ad.comments.map((c) => (
                                    <div key={c.id} className="text-xs">
                                      <span className="font-bold text-slate-800 dark:text-zinc-200">{c.author}: </span>
                                      <span className="font-light text-slate-600 dark:text-zinc-400">{c.content}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <form onSubmit={(e) => handleAdCommentSubmit(ad.id, e)} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Ask seller a public question..."
                                  value={adCommentInputs[ad.id] || ""}
                                  onChange={(e) => setAdCommentInputs({ ...adCommentInputs, [ad.id]: e.target.value })}
                                  className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 rounded-xl focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                  Ask
                                </button>
                              </form>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Simulated WhatsApp routing modal */}
                {whatsappModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-zinc-900">
                        <span className="font-black text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-505">
                          Secure WhatsApp Link Route
                        </span>
                        <button
                          onClick={() => setWhatsappModal(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">🛡️</span>
                        <div>
                          <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-400">Privacy & Click Shield</h4>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
                            Purchaser numbers are not exposed on listing pages. Links route directly to WhatsApp API utilizing secure text templates.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-505 mb-1">Generated URL Route:</label>
                          <div className="p-2.5 bg-slate-100 dark:bg-zinc-900 rounded-xl text-[10px] font-mono break-all text-slate-600 dark:text-zinc-300">
                            https://wa.me/{whatsappModal.phone}?text=Hi%20{whatsappModal.seller},%20I%20am%20interested%20in%20your%20listing%20%22{encodeURIComponent(whatsappModal.title)}%22%20on%20Orchard%20Connect.
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-505 mb-1">Pre-filled Message:</label>
                          <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl text-xs border border-slate-100 dark:border-zinc-900/60 font-light text-slate-700 dark:text-zinc-400">
                            "Hi {whatsappModal.seller}, I am interested in your listing "{whatsappModal.title}" listed on Orchard Connect."
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setWhatsappModal(null)}
                          className="flex-1 py-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <a
                          href={`https://wa.me/${whatsappModal.phone}?text=Hi%20${whatsappModal.seller},%20I%20am%20interested%20in%20your%20listing%20%22${encodeURIComponent(whatsappModal.title)}%22%20on%20Orchard%20Connect.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setWhatsappModal(null)}
                          className="flex-1 py-3 text-center text-xs font-bold rounded-xl bg-[#25D366] text-white hover:bg-[#20ba5a] cursor-pointer"
                        >
                          Proceed to Chat
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DIRECTORIES & POLLS */}
            {activeTab === "directory_polls" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                
                {/* Left side: Directory & Reviews */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-bold text-slate-800 dark:text-zinc-100">Scoped Emergency Lookup</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-505 mb-4">Numbers are private and scoped strictly to verified residents. Test scoping filters.</p>
                    
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-505">Security Access Shield:</span>
                      <button
                        onClick={() => setScopedMode(!scopedMode)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${scopedMode ? "bg-red-500/15 border-red-500/20 text-red-500" : "bg-slate-100 dark:bg-zinc-800 text-slate-505 dark:text-zinc-400 border-transparent"}`}
                      >
                        {scopedMode ? "Verified Scoping Active" : "Unverified Scoping Off"}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search emergency services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs px-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900/50">
                    {contacts
                      .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((c, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200/30 dark:border-zinc-800 last:border-b-0">
                          <div>
                            <span className="block text-xs font-semibold text-slate-800 dark:text-zinc-200">{c.name}</span>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-505">{c.category}</span>
                          </div>
                          
                          {scopedMode ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-600 rounded-lg text-[10px] font-mono select-none">
                              <span>🔒</span>
                              <span className="blur-[3px] select-none">{c.number}</span>
                            </div>
                          ) : (
                            <a
                              href={`tel:${c.number}`}
                              className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            >
                              📞 {c.number}
                            </a>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Local Business Directory & Reviews */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/40 dark:border-zinc-900/80">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Local Business: Orchard Grocers</h4>
                      <div className="flex text-amber-500 text-xs">★★★★☆ <span className="text-slate-400 dark:text-zinc-505 text-[10px] ml-1">(4.5)</span></div>
                    </div>

                    {reviewError && (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 font-bold">
                        {reviewError}
                      </div>
                    )}

                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="p-3 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700 dark:text-zinc-300">{rev.author}</span>
                              <span className="text-amber-500">{"★".repeat(rev.rating)}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteReview(rev.id, !!rev.isSelf)}
                              className="text-red-500 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 font-light leading-relaxed">{rev.content}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddReview} className="space-y-3 bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900/60">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider">Leave a Review</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setNewReviewStars(star)}
                              className={`text-sm cursor-pointer ${star <= newReviewStars ? "text-amber-500" : "text-slate-300 dark:text-zinc-700"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write honest rating feedback..."
                          value={newReviewText}
                          onChange={(e) => setNewReviewText(e.target.value)}
                          className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right side: Community Poll */}
                <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-slate-200/40 dark:border-zinc-900/80 lg:pl-8 pt-6 lg:pt-0">
                  <div className="space-y-2">
                    <h3 className="text-md font-bold text-slate-800 dark:text-zinc-100">Civic Polls & Voting</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-505">Residents are limited to 1 active running poll. Creators can suspend or toggle anonymity.</p>
                  </div>

                  <div className="p-5 bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-900 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                        Civic Voice Active Poll
                      </span>
                      {pollSuspended ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[9px] font-black uppercase">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase">
                          VOTING OPEN
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                      Should we request Bahria Town management for a new dedicated playground in Phase 1 Block G?
                    </h4>

                    {/* Progress bars voting */}
                    <div className="space-y-3.5 pt-2">
                      {[
                        { key: "yes", label: "Yes, immediately", count: pollVotes.yes },
                        { key: "no", label: "No, other priorities first", count: pollVotes.no },
                        { key: "other", label: "Undecided", count: pollVotes.other },
                      ].map((opt) => {
                        const total = pollVotes.yes + pollVotes.no + pollVotes.other;
                        const pct = Math.round((opt.count / total) * 100) || 0;
                        const isSelected = votedOption === opt.key;

                        return (
                          <div key={opt.key} className="space-y-1">
                            <button
                              onClick={() => handleVote(opt.key as any)}
                              disabled={pollSuspended}
                              className={`w-full flex items-center justify-between text-left p-3 rounded-xl border text-xs font-semibold transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer ${isSelected ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" : "border-slate-200 dark:border-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}
                            >
                              <span>{opt.label}</span>
                              <span className="font-mono text-slate-400 dark:text-zinc-505">{opt.count} votes ({pct}%)</span>
                            </button>
                            {/* Animated bar width percentage */}
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${isSelected ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-800"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Voters list panel */}
                    <div className="border-t border-slate-100 dark:border-zinc-900 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-505">
                          Anonymous Voting Mode:
                        </span>
                        <button
                          onClick={() => setAnonymousPoll(!anonymousPoll)}
                          className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase border cursor-pointer ${anonymousPoll ? "bg-amber-500/10 border-amber-500/25 text-amber-500" : "bg-slate-100 dark:bg-zinc-800 border-transparent text-slate-555"}`}
                        >
                          {anonymousPoll ? "Anonymous Enabled" : "Public Voters List"}
                        </button>
                      </div>

                      {anonymousPoll ? (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-505 italic p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
                          🔒 Voters' identities are hidden. Only total aggregates are broadcasted to prevent Phase disputes.
                        </p>
                      ) : (
                        <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/40 rounded-xl space-y-2.5 text-[10px]">
                          <span className="block font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest text-[9px]">Voters ledger:</span>
                          <div>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Yes: </span>
                            <span className="text-slate-600 dark:text-zinc-400">{votersList.yes.join(", ")}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-rose-500">No: </span>
                            <span className="text-slate-600 dark:text-zinc-400">{votersList.no.join(", ")}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suspension Actions */}
                    <div className="border-t border-slate-100 dark:border-zinc-900 pt-3 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 dark:text-zinc-505">Active Poll Limit Warning: 1 active poll maximum</span>
                      <button
                        onClick={() => setPollSuspended(!pollSuspended)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${pollSuspended ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/25"}`}
                      >
                        {pollSuspended ? "Reopen Poll" : "Suspend Poll early"}
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: LIVE NOTIFICATION SANDBOX */}
            {activeTab === "realtime" && (
              <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-900">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Live Updates Sandbox</h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-555">Test the real-time event pipeline. Simulate backend events and watch the UI react without refresh.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Live Broadcast Simulation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Left explanation card */}
                  <div className="bg-slate-50 dark:bg-zinc-900/40 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900/80 space-y-4">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider">How Live Updates Work</h4>
                    <p className="text-xs font-light text-slate-600 dark:text-zinc-400 leading-relaxed">
                      Our architecture utilizes real-time communication channels. When a neighbor likes, comments, or mentions you, updates are pushed instantly to your device without reloads.
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-505 font-bold uppercase tracking-wider">
                        <span>🔒 Encrypted Live Channels:</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl text-[10px] font-mono border border-slate-200/50 dark:border-zinc-900 space-y-1 text-slate-500 dark:text-zinc-400">
                        <div>Channel: Private.Resident.38</div>
                        <div>Event: NewNotificationReceived</div>
                        <div className="text-emerald-500 mt-1">✓ Secure Connection Active</div>
                      </div>
                    </div>
                  </div>

                  {/* Right interactive triggers */}
                  <div className="border border-slate-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-6 rounded-2xl space-y-4 text-center">
                    <span className="block text-3xl">📡</span>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Live Notification Simulator</h4>
                    <p className="text-xs text-slate-505 dark:text-zinc-400 leading-relaxed font-light">
                      Click the button below to dispatch a simulated real-time event. Watch the notification bell in the header increment and slide-in notifications appear in real-time.
                    </p>

                    <button
                      onClick={triggerMockWebSocketEvent}
                      disabled={isSimulatingEvent}
                      className="w-full py-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/5"
                    >
                      {isSimulatingEvent ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span>Emitting Event Payload...</span>
                        </div>
                      ) : (
                        "Trigger Live Event"
                      )}
                    </button>

                    <span className="block text-[9px] uppercase font-bold text-slate-400 dark:text-zinc-505">
                      Powered by encrypted push notification protocol
                    </span>
                  </div>

                </div>
              </div>
            )}

          </div>
        </section>

        {/* 4. Trust & Security Grid */}
        <section id="safety" className="space-y-6 pt-8 border-t border-slate-200/40 dark:border-zinc-900">
          <div className="max-w-xl mx-auto text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Community Standards & Safety</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-505">Underneath the UI layers are multiple trust barriers protecting neighbor identity and listings integrity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Spec 1 */}
            <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
              <span className="block text-lg">🔒</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Secure Verification</h4>
              <p className="text-xs font-light text-slate-505 dark:text-zinc-400 leading-relaxed">
                Phase and block coordinates are verified by staff. Every neighbor account maps strictly to a real physical residency.
              </p>
            </div>

            {/* Spec 2 */}
            <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
              <span className="block text-lg">⚡</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Instant Synchronization</h4>
              <p className="text-xs font-light text-slate-505 dark:text-zinc-400 leading-relaxed">
                Live discussions, marketplace listing comments, and community votes update instantly across active neighbor screens.
              </p>
            </div>

            {/* Spec 3 */}
            <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
              <span className="block text-lg">🛡️</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Moderation Shields</h4>
              <p className="text-xs font-light text-slate-505 dark:text-zinc-400 leading-relaxed">
                Self-policing community moderation automatically hides spam, scams, or abusive timeline content after 5 resident flags.
              </p>
            </div>

            {/* Spec 4 */}
            <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
              <span className="block text-lg">📦</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Private Vault Protection</h4>
              <p className="text-xs font-light text-slate-555 dark:text-zinc-400 leading-relaxed">
                Verification documents are securely encrypted, kept in private storage vaults, and served solely via single-use expiring links.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Gated Action Banner */}
        <section className="w-full bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden text-center md:text-left shadow-lg">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient opacity-10 pointer-events-none" />
          <div className="max-w-3xl space-y-6 relative z-10">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Ready to Connect with Bahria Orchard?</h2>
            <p className="text-sm md:text-base font-light text-emerald-50 leading-relaxed max-w-xl">
              Join over 1,400 verified neighbors. Access listing discounts, participate in civic voting polls, and verify your block residency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <a
                href="/auth/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-emerald-800 font-bold rounded-full text-xs uppercase tracking-wider hover:bg-neutral-100 active:scale-95 transition-all text-center cursor-pointer"
              >
                Get Verified Access
              </a>
              <span className="text-[11px] text-emerald-100 font-medium">🛡️ Secure 256-bit Document Transmission Encryption</span>
            </div>
          </div>
        </section>

      </main>

      {/* 6. Footer */}
      <footer className="border-t border-slate-200/60 dark:border-zinc-900 bg-white dark:bg-black py-8 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-zinc-555">
          <div>
            © {new Date().getFullYear()} Orchard Connect. All rights reserved. Designed exclusively for Bahria Orchard residents.
          </div>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-slate-600 dark:hover:text-zinc-300">Privacy Policy</a>
            <a href="/data-deletion" className="hover:text-slate-600 dark:hover:text-zinc-300">Data Deletion Policy</a>
            <a href="/terms" className="hover:text-slate-600 dark:hover:text-zinc-300">Terms of Service</a>
            <a href="/disclaimer" className="hover:text-slate-600 dark:hover:text-zinc-300">Disclaimer</a>
            <a href="/guidelines" className="hover:text-slate-600 dark:hover:text-zinc-300">Community Guidelines</a>
            <a href="/support" className="hover:text-slate-600 dark:hover:text-zinc-300">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
