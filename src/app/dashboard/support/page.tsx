"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
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

interface SupportTicket {
  id: string;
  tracking_id: string;
  category: "general" | "auth_issue" | "security" | "marketplace_dispute" | "technical";
  subject: string;
  description: string;
  status: "pending" | "open" | "resolved" | "closed";
  resolution_notes?: string | null;
  created_at: string;
}

export default function ResidentSupportTicketsPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Fetch resident session and tickets
  const fetchTicketsData = async () => {
    try {
      const userRes = await apiRequest("/api/user");
      if (!userRes.ok) {
        router.push("/auth/login");
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      if (!userData.user?.resident_profile) {
        router.push("/auth/complete-profile");
        return;
      }

      const ticketsRes = await apiRequest("/api/support/tickets");
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setSupportTickets(ticketsData);
      }
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "info" | "success" | "error" }>({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = (message: string, type: "info" | "success" | "error" = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  useEffect(() => {
    fetchTicketsData();
  }, []);

  // Listen for real-time ticket status updates
  useEffect(() => {
    if (!currentUser) return;

    const echo = getEcho();
    if (!echo) return;

    const channelName = `user.${currentUser.id}`;

    echo.private(channelName)
      .listen(".SupportTicketStatusUpdated", (data: any) => {
        // Show premium toast notification
        const message = `Support Ticket [${data.tracking_id}] status has been updated to: ${data.status.toUpperCase()}`;
        showToast(message, "success");
        
        // Refresh support tickets list
        fetchTicketsData();
      });

    return () => {
      echo.leave(channelName);
    };
  }, [currentUser]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Syncing support archives...</p>
      </div>
    );
  }

  const profile = currentUser.resident_profile;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const categoryLabels: Record<string, string> = {
    general: "General Inquiry",
    auth_issue: "Account & Auth Issue",
    security: "Security Violation",
    marketplace_dispute: "Marketplace Dispute",
    technical: "Technical Issue",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    open: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    closed: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-xs font-semibold max-w-sm animate-slide-in ${
          toast.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-440 border-emerald-250/30"
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
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Orchard Connect
            </Link>
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
        <aside className="lg:col-span-3 space-y-6">
          <NavigationCard currentUser={currentUser} activeKey="support-tickets" variant="desktop" />
        </aside>

        {/* Center / Dashboard Main Panel */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200/60 dark:border-zinc-850 pb-5">
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tight">Support Tickets</h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                View status updates and resolution notes for your support requests.
              </p>
            </div>
            <Link
              href="/support"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              Submit New Ticket →
            </Link>
          </div>

          {/* Tickets List */}
          {supportTickets.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200/60 dark:border-zinc-800/80 p-12 text-center shadow-sm">
              <span className="text-4xl mb-4 block">🎫</span>
              <h3 className="font-bold text-sm mb-1 text-slate-800 dark:text-zinc-250">No support tickets found</h3>
              <p className="text-slate-400 dark:text-zinc-500 text-xs italic font-light max-w-sm mx-auto">
                If you have questions or technical issues, click the button above to submit a ticket to the Orchard administration staff.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-150 dark:border-zinc-850 bg-neutral-50/50 dark:bg-zinc-950/20 text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-4">Ticket ID</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Submitted At</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-zinc-850">
                    {supportTickets.map((ticket) => {
                      const isExpanded = expandedTicketId === ticket.id;
                      const hasResolution = !!ticket.resolution_notes;

                      return (
                        <React.Fragment key={ticket.id}>
                          <tr className="hover:bg-neutral-50/30 dark:hover:bg-zinc-850/10 transition-colors">
                            <td className="p-4 font-mono font-bold tracking-wider text-slate-800 dark:text-neutral-250">
                              {ticket.tracking_id}
                            </td>
                            <td className="p-4 font-semibold max-w-[220px] truncate">
                              {ticket.subject}
                            </td>
                            <td className="p-4 text-slate-500 dark:text-zinc-400">
                              {categoryLabels[ticket.category] || ticket.category}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full uppercase tracking-wider ${statusColors[ticket.status]}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 dark:text-zinc-500">
                              {new Date(ticket.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline active:scale-95 transition-all cursor-pointer"
                              >
                                {isExpanded ? "Collapse" : "View Details"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-neutral-50/20 dark:bg-zinc-950/10">
                              <td colSpan={6} className="p-5 border-t border-neutral-100 dark:border-zinc-850 text-xs">
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <div className="font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Description</div>
                                    <p className="text-slate-650 dark:text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-[9px]">Resolution & Staff Notes</div>
                                    {hasResolution ? (
                                      <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] dark:bg-emerald-950/[0.01] prose dark:prose-invert max-w-none text-slate-655 dark:text-zinc-300 font-light" dangerouslySetInnerHTML={{ __html: ticket.resolution_notes || "" }} />
                                    ) : (
                                      <p className="text-slate-400 dark:text-zinc-500 italic font-light">Your ticket is currently being reviewed. As soon as a resolution note is left, it will appear here.</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
