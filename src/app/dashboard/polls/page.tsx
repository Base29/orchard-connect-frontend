"use client";

import React, { useState, useEffect, useRef } from "react";
import NavigationCard from "@/components/NavigationCard";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
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
  resident_profile?: ResidentProfile | null;
  roles?: string[];
}

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count: number;
}

interface VoteDetail {
  id: string;
  poll_id: string;
  poll_option_id: string;
  user_id: string;
  created_at: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
    roles?: string[];
  };
  option: {
    id: string;
    option_text: string;
  };
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
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
    roles?: string[];
  };
  user_voted_option_id?: string | null;
  votes?: VoteDetail[];
  is_anonymous: boolean;
}

export default function PollsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const toUTCISOString = (localDateTimeStr: string): string => {
    if (!localDateTimeStr) return "";
    return new Date(localDateTimeStr + "+05:00").toISOString();
  };

  // Session User
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Polls State
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "my-polls" | "closed">("active");

  // Create Poll Modal & Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createStartAt, setCreateStartAt] = useState("");
  const [createEndAt, setCreateEndAt] = useState("");
  const [createOptions, setCreateOptions] = useState<string[]>(["", ""]);
  const [createIsAnonymous, setCreateIsAnonymous] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit Poll Modal & Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Suspend Reason Modal State
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendingPollId, setSuspendingPollId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  // Expanded Voters List State
  const [expandedVoters, setExpandedVoters] = useState<Record<string, boolean>>({});
  const toggleVoters = (pollId: string) => {
    setExpandedVoters(prev => ({ ...prev, [pollId]: !prev[pollId] }));
  };

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

  // Fetch Session User details
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
      console.error("Auth context error:", err);
      showToast("Session expired. Please sign in again.", "error");
      router.push("/auth/login");
      return null;
    }
  };

  // Fetch Polls
  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/polls");
      if (res.ok) {
        const data = await res.json();
        setPolls(data.data || []);
      } else {
        showToast("Failed to retrieve polls list.", "error");
      }
    } catch (err) {
      console.error("Error retrieving polls:", err);
      showToast("Could not connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const user = await fetchUser();
      if (user) {
        await fetchPolls();
      }
    };
    initialize();
  }, []);

  const isVerified = (): boolean => {
    return currentUser?.resident_profile?.is_verified === true || currentUser?.resident_profile?.status === "approved";
  };

  const isModerator = (): boolean => {
    if (!currentUser) return false;
    return currentUser.status === "admin" || (currentUser as any).roles?.some((r: any) => ["Super Admin", "Feed Moderator"].includes(r.name));
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/");
  };

  // Check if current user has any active poll running
  const hasActivePollRunning = (): boolean => {
    if (!currentUser) return false;
    const now = new Date();
    return polls.some(poll => {
      if (poll.user_id !== currentUser.id) return false;
      if (poll.status !== "active") return false;
      const start = new Date(poll.start_at);
      const end = new Date(poll.end_at);
      return start <= now && end >= now;
    });
  };

  // Option change handler for creation form
  const handleOptionChange = (index: number, value: string) => {
    const next = [...createOptions];
    next[index] = value;
    setCreateOptions(next);
  };

  const addOptionField = () => {
    if (createOptions.length < 10) {
      setCreateOptions([...createOptions, ""]);
    }
  };

  const removeOptionField = (index: number) => {
    if (createOptions.length > 2) {
      setCreateOptions(createOptions.filter((_, i) => i !== index));
    }
  };

  // Option change handler for edit form
  const handleEditOptionChange = (index: number, value: string) => {
    const next = [...editOptions];
    next[index] = value;
    setEditOptions(next);
  };

  const addEditOptionField = () => {
    if (editOptions.length < 10) {
      setEditOptions([...editOptions, ""]);
    }
  };

  const removeEditOptionField = (index: number) => {
    if (editOptions.length > 2) {
      setEditOptions(editOptions.filter((_, i) => i !== index));
    }
  };

  // Submit new poll
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerified() === false) return;

    if (hasActivePollRunning()) {
      showToast("You already have an active poll running.", "error");
      return;
    }

    const filteredOptions = createOptions.map(o => o.trim()).filter(o => o !== "");
    if (filteredOptions.length < 2) {
      showToast("Please enter at least 2 options.", "error");
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await apiRequest("/api/polls", {
        method: "POST",
        body: JSON.stringify({
          title: createTitle.trim(),
          description: createDescription.trim() || null,
          start_at: toUTCISOString(createStartAt),
          end_at: toUTCISOString(createEndAt),
          options: filteredOptions,
          is_anonymous: createIsAnonymous,
        }),
      });

      if (res.ok) {
        showToast("Poll created successfully!", "success");
        setIsCreateModalOpen(false);
        // Reset form
        setCreateTitle("");
        setCreateDescription("");
        setCreateStartAt("");
        setCreateEndAt("");
        setCreateOptions(["", ""]);
        setCreateIsAnonymous(false);
        
        // Refetch polls
        fetchPolls();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to create poll.", "error");
      }
    } catch (err) {
      showToast("Error creating poll.", "error");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (poll: Poll) => {
    setEditingPollId(poll.id);
    setEditTitle(poll.title);
    setEditDescription(poll.description || "");
    
    // Format dates to YYYY-MM-DDTHH:MM for datetime-local input in Asia/Karachi timezone
    const formatLocal = (isoStr: string) => {
      if (!isoStr) return "";
      const d = new Date(isoStr);
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Karachi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(d);
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value || "";
      let hour = part("hour");
      if (hour === "24") hour = "00";
      return `${part("year")}-${part("month")}-${part("day")}T${hour}:${part("minute")}`;
    };

    setEditStartAt(formatLocal(poll.start_at));
    setEditEndAt(formatLocal(poll.end_at));
    setEditOptions(poll.options.map(o => o.option_text));
    setEditIsAnonymous(poll.is_anonymous || false);
    setIsEditModalOpen(true);
  };

  // Submit edit poll
  const handleEditPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPollId) return;

    const filteredOptions = editOptions.map(o => o.trim()).filter(o => o !== "");
    if (filteredOptions.length < 2) {
      showToast("Please enter at least 2 options.", "error");
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await apiRequest(`/api/polls/${editingPollId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          start_at: toUTCISOString(editStartAt),
          end_at: toUTCISOString(editEndAt),
          options: filteredOptions,
          is_anonymous: editIsAnonymous,
        }),
      });

      if (res.ok) {
        showToast("Poll updated successfully!", "success");
        setIsEditModalOpen(false);
        fetchPolls();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to update poll.", "error");
      }
    } catch (err) {
      showToast("Error updating poll.", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Submit Vote (with Optimistic Update)
  const handleCastVote = async (pollId: string, optionId: string) => {
    if (isVerified() === false) {
      showToast("Verification required to cast votes.", "error");
      return;
    }

    // Find targets
    const poll = polls.find(p => p.id === pollId);
    if (!poll || poll.user_voted_option_id) return;

    // Optimistically update
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
        fetchPolls();
        const data = await res.json();
        showToast(data.message || "Failed to register vote.", "error");
      }
    } catch (err) {
      fetchPolls();
      showToast("Network error registering vote.", "error");
    }
  };

  // Open Suspend Modal
  const openSuspendModal = (pollId: string) => {
    setSuspendingPollId(pollId);
    setSuspendReason("");
    setIsSuspendModalOpen(true);
  };

  // Suspend poll action
  const handleSuspendPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingPollId) return;

    setSuspendSubmitting(true);
    try {
      const res = await apiRequest(`/api/polls/${suspendingPollId}/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason: suspendReason.trim() || null }),
      });

      if (res.ok) {
        showToast("Poll has been stopped/suspended.", "success");
        setIsSuspendModalOpen(false);
        fetchPolls();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to suspend poll.", "error");
      }
    } catch (err) {
      showToast("Error suspending poll.", "error");
    } finally {
      setSuspendSubmitting(false);
    }
  };

  // Filter polls based on active tab
  const getFilteredPolls = () => {
    const now = new Date();
    return polls.filter(poll => {
      const start = new Date(poll.start_at);
      const end = new Date(poll.end_at);
      const active = poll.status === "active" && start <= now && end >= now;

      if (activeTab === "active") {
        return active;
      } else if (activeTab === "my-polls") {
        return currentUser && poll.user_id === currentUser.id;
      } else {
        // closed
        return !active || poll.status === "suspended";
      }
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Syncing community polls...</p>
      </div>
    );
  }

  const profile = currentUser.resident_profile;
  const filteredPolls = getFilteredPolls();

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
                  <strong>Read-Only Guest State</strong> — Proof documents are pending review. Access to poll creation and voting is locked.
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
              Community Polls
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
          <NavigationCard currentUser={currentUser} activeKey="polls" variant="desktop" />
        </aside>

        {/* Center Content */}
        <main className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Community Polls</h1>
              <p className="text-xs font-light text-slate-400 dark:text-zinc-400">
                Share your voice. Vote on community actions and propose new polls.
              </p>
            </div>

            {isVerified() && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={hasActivePollRunning()}
                  className={`px-4 py-2 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                    hasActivePollRunning()
                      ? "bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-650 opacity-60 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95"
                  }`}
                  title={hasActivePollRunning() ? "You already have an active poll running" : "Create a new poll"}
                >
                  <span>+</span> Create Poll
                </button>
              </div>
            )}
          </div>

          <NavigationCard currentUser={currentUser} activeKey="polls" variant="mobile" />

          {/* Enforce One Active Poll Alert */}
          {isVerified() && hasActivePollRunning() && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 font-light flex items-center gap-2.5">
              <span>⚠️</span>
              <div>
                <strong>Active Poll Restriction</strong>: You currently have a running active poll. You cannot publish a new poll until your running poll finishes or is suspended.
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-4 shadow-sm flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "active"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                  : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-350 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
              }`}
            >
              🔥 Active Polls
            </button>
            <button
              onClick={() => setActiveTab("my-polls")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "my-polls"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                  : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-350 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
              }`}
            >
              👤 My Polls
            </button>
            <button
              onClick={() => setActiveTab("closed")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "closed"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                  : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-350 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
              }`}
            >
              🏁 Past / Closed Polls
            </button>
          </div>

          {/* Polls Listing */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 dark:text-zinc-450 font-light">Loading community board polls...</p>
            </div>
          ) : filteredPolls.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 py-20 text-center shadow-sm">
              <p className="text-slate-400 dark:text-zinc-400 text-sm font-light">
                No polls found under this tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPolls.map((poll) => {
                const now = new Date();
                const start = new Date(poll.start_at);
                const end = new Date(poll.end_at);
                const isActivePoll = poll.status === "active" && start <= now && end >= now;
                const hasVoted = !!poll.user_voted_option_id;

                return (
                  <div
                    key={poll.id}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden`}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {getInitials(poll.user.name)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                            <span>{poll.user.name}</span>
                            <RoleBadge roles={poll.user.roles} />
                            {poll.user.resident_profile && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-neutral-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 border border-neutral-200/10">
                                {poll.user.resident_profile.phase} • {poll.user.resident_profile.block}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-zinc-500">
                            Published {new Date(poll.created_at).toLocaleDateString("en-US", { timeZone: "Asia/Karachi" })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {poll.is_anonymous && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-955/20 dark:text-blue-400 border border-blue-200/20">
                            🔒 Anonymous
                          </span>
                        )}

                        {poll.status === "suspended" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-200/25">
                            ⛔ Suspended
                          </span>
                        ) : !isActivePoll ? (
                          end < now ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-neutral-200/20">
                              🏁 Closed
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/20">
                              ⏳ Scheduled
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-400 border border-emerald-250/20 animate-pulse">
                            🔥 Active
                          </span>
                        )}

                        {/* Edit Action Button */}
                        {currentUser && poll.user_id === currentUser.id && !isActivePoll && poll.status !== "suspended" && (
                          <button
                            onClick={() => openEditModal(poll)}
                            className="p-1.5 text-xs text-slate-400 hover:text-slate-800 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-neutral-200/30"
                            title="Edit Inactive Poll"
                          >
                            ✏️ Edit
                          </button>
                        )}

                        {/* Suspend / Stop button (Moderators or Creators) */}
                        {isActivePoll && (isModerator() || (currentUser && poll.user_id === currentUser.id)) && (
                          <button
                            onClick={() => openSuspendModal(poll.id)}
                            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 border border-rose-200/50 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-md transition-all active:scale-[0.98] cursor-pointer"
                            title="Stop or suspend this active poll"
                          >
                            Stop Poll
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-slate-850 dark:text-neutral-100">
                        {poll.title}
                      </h2>
                      {poll.description && (
                        <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                          {poll.description}
                        </p>
                      )}
                    </div>

                    {/* Options list / Results */}
                    <div className="space-y-2.5 pt-2">
                      {poll.options.map((option) => {
                        const totalVotes = poll.votes_count;
                        const percentage = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
                        const isUserChoice = poll.user_voted_option_id === option.id;
                        const showResults = hasVoted || !isActivePoll;

                        return (
                          <div key={option.id} className="relative">
                            {showResults ? (
                              // Vote percentages view
                              <div className="w-full flex flex-col justify-center rounded-xl border border-neutral-250/20 dark:border-zinc-800/80 p-3 text-xs overflow-hidden relative min-h-[44px]">
                                {/* progress bar fill background */}
                                <div 
                                  className={`absolute left-0 top-0 bottom-0 transition-all duration-500 -z-10 ${
                                    isUserChoice 
                                      ? "bg-emerald-500/10 dark:bg-emerald-500/5 border-r border-emerald-500/20" 
                                      : "bg-neutral-100 dark:bg-zinc-850/60"
                                  }`} 
                                  style={{ width: `${percentage}%` }}
                                />
                                
                                <div className="flex justify-between items-center relative z-10 font-medium">
                                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-250">
                                    {option.option_text}
                                    {isUserChoice && (
                                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-200/20">
                                        Your Choice
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-slate-400 dark:text-zinc-450 shrink-0">
                                    {percentage}% ({option.votes_count} {option.votes_count === 1 ? 'vote' : 'votes'})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Voting interaction radio row
                              <button
                                onClick={() => handleCastVote(poll.id, option.id)}
                                disabled={!isActivePoll || !isVerified()}
                                className={`w-full text-left flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.99] cursor-pointer hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-zinc-800 ${
                                  !isVerified() 
                                    ? "opacity-50 cursor-not-allowed border-neutral-150 dark:border-zinc-850 bg-slate-50/20" 
                                    : "border-neutral-200 dark:border-zinc-800"
                                }`}
                              >
                                <span className="text-slate-800 dark:text-neutral-200">{option.option_text}</span>
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-700 flex items-center justify-center shrink-0 group-hover:border-emerald-500">
                                  <div className="w-2 h-2 rounded-full bg-transparent" />
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline dates info footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-100 dark:border-zinc-850 mt-4 text-[10px] text-slate-400 dark:text-zinc-500 font-light">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          📅 Start: {new Date(poll.start_at).toLocaleString("en-US", { timeZone: "Asia/Karachi", dateStyle: "short", timeStyle: "short" })}
                        </span>
                        <span className="flex items-center gap-1">
                          ⏳ Finish: {new Date(poll.end_at).toLocaleString("en-US", { timeZone: "Asia/Karachi", dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-500 dark:text-zinc-400">
                        Total Votes: {poll.votes_count}
                      </div>
                    </div>

                    {poll.is_anonymous && (
                      <div className="pt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 italic font-light">
                        <span>🔒</span>
                        <span>Voter identities are anonymous for this poll. Only vote counts are tracked.</span>
                      </div>
                    )}

                    {/* Collapsible Voters List for creator/admin/moderator */}
                    {!poll.is_anonymous && ((currentUser && poll.user_id === currentUser.id) || isModerator()) && poll.votes && poll.votes.length > 0 && (
                      <div className="pt-3 border-t border-neutral-100 dark:border-zinc-850 mt-4">
                        <button
                          onClick={() => toggleVoters(poll.id)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-neutral-200 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <span>{expandedVoters[poll.id] ? "▼" : "▶"}</span>
                          <span>👥 View Voters List ({poll.votes.length})</span>
                        </button>

                        {expandedVoters[poll.id] && (
                          <div className="mt-3.5 space-y-2 max-h-[250px] overflow-y-auto pr-1">
                            {poll.votes.map((vote) => (
                              <div
                                key={vote.id}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/50 dark:bg-zinc-850/30 border border-neutral-100 dark:border-zinc-800/60 text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-[10px]">
                                    {getInitials(vote.user.name)}
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-750 dark:text-neutral-100">
                                      <span>{vote.user.name}</span>
                                      <RoleBadge roles={vote.user.roles} />
                                    </div>
                                    {vote.user.resident_profile && (
                                      <div className="text-[9px] text-slate-400 dark:text-zinc-550 font-light">
                                        {vote.user.resident_profile.phase} • {vote.user.resident_profile.block}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="px-2 py-0.5 rounded-md font-bold text-[9px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250/20">
                                    {vote.option.option_text}
                                  </span>
                                  <div className="text-[8px] text-slate-400 dark:text-zinc-500 mt-1 font-light">
                                    {new Date(vote.created_at).toLocaleString("en-US", { timeZone: "Asia/Karachi", dateStyle: "short", timeStyle: "short" })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* CREATE POLL MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                📊 Create a Resident Poll
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Poll Question / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Propose jogging track extension in central park"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Details / Context
                </label>
                <textarea
                  placeholder="Add details, implications, or reasoning to help residents understand..."
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-855 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createStartAt}
                    onChange={(e) => setCreateStartAt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Finish Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createEndAt}
                    onChange={(e) => setCreateEndAt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-zinc-850/60 p-3 rounded-xl border border-neutral-200/30 dark:border-zinc-800/40">
                <input
                  type="checkbox"
                  id="create-is-anonymous"
                  checked={createIsAnonymous}
                  onChange={(e) => setCreateIsAnonymous(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-neutral-355 dark:border-zinc-700 bg-transparent cursor-pointer"
                />
                <label htmlFor="create-is-anonymous" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
                  🔒 Anonymous Poll
                  <span className="block text-[10px] font-light text-slate-400 dark:text-zinc-550 mt-0.5 leading-relaxed">
                    Voter names and individual selections will be kept completely private. Only vote counts and option percentages will be displayed.
                  </span>
                </label>
              </div>

              {/* Options Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Poll Choices / Options * (Min 2, Max 10)
                  </label>
                  {createOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={addOptionField}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {createOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder={`Option Choice ${i + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                      {createOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOptionField(i)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/25 rounded-lg text-xs"
                          title="Remove option"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createSubmitting}
                  className="px-4 py-2 border border-neutral-200/60 dark:border-zinc-800/80 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-55"
                >
                  {createSubmitting ? "Creating..." : "Publish Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT POLL MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                ✏️ Edit Scheduled Poll
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditPoll} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Poll Question / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Question / Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Details / Context
                </label>
                <textarea
                  placeholder="Add details, implications, or reasoning..."
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-855 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editStartAt}
                    onChange={(e) => setEditStartAt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Finish Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editEndAt}
                    onChange={(e) => setEditEndAt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-zinc-855/60 p-3 rounded-xl border border-neutral-200/30 dark:border-zinc-800/40">
                <input
                  type="checkbox"
                  id="edit-is-anonymous"
                  checked={editIsAnonymous}
                  onChange={(e) => setEditIsAnonymous(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-neutral-355 dark:border-zinc-700 bg-transparent cursor-pointer"
                />
                <label htmlFor="edit-is-anonymous" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
                  🔒 Anonymous Poll
                  <span className="block text-[10px] font-light text-slate-400 dark:text-zinc-555 mt-0.5 leading-relaxed">
                    Voter names and individual selections will be kept completely private. Only vote counts and option percentages will be displayed.
                  </span>
                </label>
              </div>

              {/* Options Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Poll Choices / Options * (Min 2, Max 10)
                  </label>
                  {editOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={addEditOptionField}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {editOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder={`Option Choice ${i + 1}`}
                        value={opt}
                        onChange={(e) => handleEditOptionChange(i, e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                      {editOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEditOptionField(i)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/25 rounded-lg text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                  className="px-4 py-2 border border-neutral-200/60 dark:border-zinc-800/80 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-55"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPEND REASON MODAL */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                ⛔ Stop / Suspend Active Poll
              </h3>
              <button 
                onClick={() => setIsSuspendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSuspendPoll} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Reason for Suspension
                </label>
                <textarea
                  required
                  placeholder="Provide details about why this poll is being stopped or suspended..."
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-855 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSuspendModalOpen(false)}
                  disabled={suspendSubmitting}
                  className="px-4 py-2 border border-neutral-200/60 dark:border-zinc-800/80 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suspendSubmitting || !suspendReason.trim()}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-55"
                >
                  {suspendSubmitting ? "Stopping..." : "Stop Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
