"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { getEcho } from "@/lib/echo";

interface NotificationData {
  title: string;
  message: string;
  target_url: string;
  metadata?: {
    type?: string;
    post_id?: string;
    comment_id?: string;
    listing_id?: string;
    liker_id?: string;
  };
}

interface Notification {
  id: string;
  type: string;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
}

interface NotificationBellProps {
  currentUser: {
    id: string;
    name: string;
  };
}

export default function NotificationBell({ currentUser }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => n.read_at === null).length;
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications on mount
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const list = data.data || [];
        setNotifications(list);

      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications via Laravel Echo / Reverb
  useEffect(() => {
    if (!currentUser) return;

    const echo = getEcho();
    if (!echo) return;

    const channelName = `App.Models.User.${currentUser.id}`;

    echo.private(channelName)
      .notification((notification: any) => {
        // Format the notification to match our interface, supporting both flat and nested payloads
        const title = notification.data?.title || notification.title || "New Notification";
        const message = notification.data?.message || notification.data?.body || notification.message || notification.body || "";
        const target_url = notification.data?.target_url || notification.target_url || "/dashboard";
        const metadata = notification.data?.metadata || notification.metadata || {};

        const newNotification: Notification = {
          id: notification.id,
          type: "App\\Notifications\\GeneralNotification",
          data: {
            title,
            message,
            target_url,
            metadata,
          },
          read_at: null,
          created_at: notification.data?.created_at || notification.created_at || new Date().toISOString(),
        };

        // Add to list, preventing duplicates
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotification.id)) {
            return prev;
          }
          return [newNotification, ...prev];
        });

        // Optional: play subtle sound or trigger toast notification
        if ("Notification" in window && Notification.permission === "granted") {
          new window.Notification(title, { body: message });
        }
      });

    return () => {
      echo.leave(channelName);
    };
  }, [currentUser]);

  // Request browser notification permissions
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleMarkAsRead = async (id: string, targetUrl: string) => {
    // Find notification and mark it locally as read
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setIsOpen(false);

    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: "POST" });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }

    // If already on the target URL path, dispatch a custom event to force scroll/highlight
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath === targetUrl) {
      window.dispatchEvent(new CustomEvent("scroll-to-target", { detail: { targetUrl } }));
    }

    // Navigate to target URL
    router.push(targetUrl);
  };

  const handleMarkAllAsRead = async () => {
    // Optimistically mark all locally
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );

    try {
      await apiRequest("/api/notifications/read-all", { method: "POST" });
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Re-fetch to sync state on failure
      fetchNotifications();
    }
  };

  // Helper for displaying time ago
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    } catch (e) {
      return "";
    }
  };

  // Resolve visual icons and color badges for notification types
  const getNotificationStyles = (type?: string) => {
    switch (type) {
      case "post_mention":
      case "comment_mention":
        return { icon: "🏷️", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "post_mention_all":
      case "comment_mention_all":
        return { icon: "📢", color: "bg-amber-500/10 text-amber-600 dark:text-amber-450" };
      case "comment":
      case "comment_reply":
        return { icon: "💬", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case "like":
        return { icon: "❤️", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
      case "verification_approved":
        return { icon: "🎉", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "verification_rejected":
        return { icon: "⚠️", color: "bg-amber-500/10 text-amber-650 dark:text-amber-450" };
      case "listing_status":
        return { icon: "🛍️", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      case "ticket_status":
        return { icon: "🎫", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "moderation_verification":
        return { icon: "📋", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" };
      case "moderation_listing_submitted":
        return { icon: "📥", color: "bg-teal-500/10 text-teal-600 dark:text-teal-400" };
      case "moderation_post_flagged":
      case "moderation_listing_flagged":
        return { icon: "🚩", color: "bg-rose-500/10 text-rose-600 dark:text-rose-455" };
      case "new_announcement":
        return { icon: "📢", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case "new_news":
        return { icon: "📰", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case "new_poll":
        return { icon: "📊", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      default:
        return { icon: "🔔", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400" };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications menu"
        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-all border border-transparent hover:border-neutral-200/50 dark:hover:border-zinc-800 relative cursor-pointer"
      >
        <svg
          className="w-5.5 h-5.5 transition-transform active:scale-95 duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 max-h-[480px] bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-850 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-slide-up transition-all duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-neutral-150">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-100/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-zinc-850/60">
            {notifications.length === 0 ? (
              <div className="px-5 py-12 text-center text-slate-400 dark:text-zinc-500 font-light flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">🔔</span>
                <p className="text-xs">You are all caught up! No notifications yet.</p>
              </div>
            ) : (
              notifications.map(item => {
                const styles = getNotificationStyles(item.data?.metadata?.type);
                const isUnread = item.read_at === null;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.data?.target_url || "/dashboard")}
                    className={`w-full text-left px-5 py-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 ${
                      isUnread ? "bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]" : ""
                    }`}
                  >
                    {/* Icon Badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${styles.color}`}>
                      {styles.icon}
                    </div>

                    {/* Text Message */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs truncate leading-snug ${isUnread ? "font-bold text-slate-900 dark:text-neutral-100" : "font-semibold text-slate-655 dark:text-zinc-400"}`}>
                          {item.data?.title || "New Notification"}
                        </h4>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-light shrink-0">
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] leading-normal font-light text-slate-500 dark:text-zinc-400 break-words">
                        {item.data?.message || ""}
                      </p>
                    </div>

                    {/* Unread indicator dot */}
                    {isUnread && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-neutral-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950/20 text-center">
            <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-light">
              Orchard Connect Real-time Alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
