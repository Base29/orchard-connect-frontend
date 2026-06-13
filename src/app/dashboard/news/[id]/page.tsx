"use client";

import React, { useState, useEffect } from "react";
import NavigationCard from "@/components/NavigationCard";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter, useParams } from "next/navigation";
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

interface Comment {
  id: string;
  news_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
    roles?: string[];
  };
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  image_url?: string | null;
  author?: {
    name: string;
  };
}

export default function NewsDetailPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const newsId = params.id as string;

  // Session & User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Article details & comments
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const commentSubmittingRef = React.useRef(false);

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
      console.error("Auth Context error:", err);
      showToast("Session expired. Please sign in again.", "error");
      router.push("/auth/login");
      return null;
    }
  };

  // Fetch single article details
  const fetchArticleDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/news/${newsId}`);
      if (res.ok) {
        const data = await res.json();
        setArticle(data);
      } else {
        if (res.status === 404) {
          setArticle(null);
        } else {
          showToast("Failed to retrieve news details.", "error");
        }
      }
    } catch (err) {
      console.error("Error retrieving news details:", err);
      showToast("Could not connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await apiRequest(`/api/news/${newsId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      } else {
        showToast("Failed to load comments.", "error");
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (newsId) {
      fetchUser().then((user) => {
        if (user) {
          fetchArticleDetail();
          fetchComments();
        }
      });
    }
  }, [newsId]);

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

  // Handle post comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !article || isVerified() === false) return;
    if (commentSubmittingRef.current) return;

    commentSubmittingRef.current = true;
    setCommentSubmitting(true);
    try {
      const res = await apiRequest(`/api/news/${newsId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newCommentText.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => {
          const exists = prev.some(c => c.id === newComment.id);
          if (exists) return prev;
          return [...prev, newComment];
        });
        setNewCommentText("");
        showToast("Comment posted!", "success");
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to submit comment.", "error");
      }
    } catch (err) {
      showToast("Network error submitting comment.", "error");
    } finally {
      commentSubmittingRef.current = false;
      setCommentSubmitting(false);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-xs font-semibold max-w-sm animate-slide-in ${
          toast.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-450 border-emerald-200/30" 
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
              Orchard News
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
          <NavigationCard currentUser={currentUser} activeKey="news" variant="desktop" />
        </aside>

        {/* Center Content */}
        <main className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          
          {/* Breadcrumb */}
          <div>
            <Link 
              href="/dashboard/news" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-450 hover:underline transition-colors"
            >
              ← Back to Orchard News
            </Link>
          </div>

          <NavigationCard currentUser={currentUser} activeKey="news" variant="mobile" />

          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-12 flex justify-center items-center shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 dark:text-zinc-400 font-light">Loading news article...</span>
              </div>
            </div>
          ) : !article ? (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-12 text-center shadow-sm">
              <div className="text-4xl mb-3">📰</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Article Not Found</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto font-light">
                This news article may have been deleted, archived, or is no longer available.
              </p>
              <Link 
                href="/dashboard/news" 
                className="inline-block mt-5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all"
              >
                Go to News Listing
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Full News Article Card */}
              <article className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
                
                {/* Meta details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-md border border-emerald-200/20 uppercase tracking-wide">
                      News Update
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-normal">
                      Published on {new Date(article.created_at).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
                    {article.title}
                  </h1>

                  <div className="text-xs text-slate-400 dark:text-zinc-550 font-light flex items-center gap-1.5 pt-1">
                    <span>👤 Published by: <strong>{article.author?.name || "Society Office"}</strong></span>
                  </div>
                </div>

                {article.image_url ? (
                  <div className="relative w-full h-[250px] md:h-[400px] rounded-xl overflow-hidden mt-4 shadow-sm border border-neutral-200/40 dark:border-zinc-850">
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-[200px] md:h-[300px] rounded-xl overflow-hidden mt-4 bg-slate-100 dark:bg-zinc-950 flex items-center justify-center border border-neutral-200/40 dark:border-zinc-850 shadow-sm">
                    <div className="text-slate-400 dark:text-zinc-550 text-6xl">📰</div>
                  </div>
                )}

                <hr className="border-neutral-100 dark:border-zinc-850" />

                {/* HTML content rendered safely */}
                <div 
                  className="prose dark:prose-invert max-w-none text-sm font-light text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />

              </article>

              {/* Comments/Discussion Section */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 space-y-5">
                <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Public Comments & Feedback
                </h2>

                {/* Comments timeline */}
                {loadingComments ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-450 italic font-light py-2">
                    No comments yet. Share your feedback or ask a question below!
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3 items-start text-xs border-b border-neutral-50 dark:border-zinc-850 pb-3.5 last:border-0 last:pb-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-neutral-200/30 dark:border-zinc-700/30">
                          {getInitials(c.user.name)}
                        </div>
                        <div className="flex-1 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl px-4 py-3 border border-neutral-100/40 dark:border-zinc-900/50">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 dark:text-zinc-100">{c.user.name}</span>
                              <RoleBadge roles={c.user.roles} />
                            </div>
                            {c.user.resident_profile && (
                              <span className="text-[9px] text-slate-400 dark:text-zinc-400 font-light">
                                {c.user.resident_profile.phase} • Block {c.user.resident_profile.block}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-zinc-350 mt-1 font-light leading-relaxed whitespace-pre-wrap">
                            {c.content}
                          </p>
                          <div className="text-[9px] text-slate-400 dark:text-zinc-550 pt-1 mt-1 font-light text-right">
                            {new Date(c.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment box */}
                {isVerified() ? (
                  <form onSubmit={handleAddComment} className="flex gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Write your comment or query regarding this update..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      disabled={commentSubmitting}
                      className="flex-1 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={commentSubmitting || !newCommentText.trim()}
                      className="px-5 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-45 cursor-pointer flex items-center justify-center shrink-0"
                    >
                      {commentSubmitting ? "Posting..." : "Send Comment"}
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-50 dark:bg-zinc-950/50 border border-dashed border-neutral-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 text-center py-4 rounded-xl">
                    🔒 Residency verification is required to participate in comments and discussion.
                  </div>
                )}

              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
