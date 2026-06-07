"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { getEcho } from "@/lib/echo";

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

interface LikeRelation {
  user_id: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
  };
  likes_count: number;
  comments_count: number;
  liked_by_user?: boolean;
  flagged_by_user?: boolean;
  likes?: LikeRelation[];
  flags?: any[];
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
  };
}


interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  contact_whatsapp: string;
  status: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
}

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Core data states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = React.useRef<User | null>(null);
  currentUserRef.current = currentUser;

  const commentSubmittingRef = React.useRef<Record<string, boolean>>({});
  const postSubmittingRef = React.useRef(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Page interaction states
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Comments states
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // Flagging states
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flaggingPostId, setFlaggingPostId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("spam");
  const [flagComment, setFlagComment] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  // Infinite scroll states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);

  const observerTarget = React.useRef<HTMLDivElement>(null);


  // Micro-toast notifications state
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

  // 1. Initial Data Fetching from Laravel Container (Optimized with Promise.all)
  const fetchData = async () => {
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

      // Initiate all requests concurrently to hide network latency
      const [postsRes, listingsRes, myListingsRes, announcementsRes] = await Promise.all([
        apiRequest("/api/posts"),
        apiRequest("/api/listings"),
        apiRequest(`/api/listings?user_id=${userData.user.id}`),
        apiRequest("/api/announcements"),
      ]);

      // Parse JSON concurrently for resolving endpoints
      const [postsData, listingsData, myListingsData, announcementsData] = await Promise.all([
        postsRes.ok ? postsRes.json() : null,
        listingsRes.ok ? listingsRes.json() : null,
        myListingsRes.ok ? myListingsRes.json() : null,
        announcementsRes.ok ? announcementsRes.json() : null,
      ]);

      if (postsData) {
        const mappedPosts = (postsData.data || []).map((post: any) => ({
          ...post,
          liked_by_user: post.likes ? post.likes.some((like: any) => like.user_id === userData.user.id) : false,
          flagged_by_user: post.flags ? post.flags.some((flag: any) => flag.user_id === userData.user.id) : false
        }));
        setPosts(mappedPosts);
        setCurrentPage(postsData.current_page || 1);
        setNextPageUrl(postsData.next_page_url || null);
        setHasMore(!!postsData.next_page_url);
      }

      if (listingsData) {
        const mappedListings = (listingsData.data || []).map((item: any) => ({
          ...item,
          flagged_by_user: item.flags ? item.flags.some((flag: any) => flag.user_id === userData.user.id) : false
        }));
        setListings(mappedListings);
      }

      if (myListingsData) {
        const mappedMyListings = (myListingsData.data || []).map((item: any) => ({
          ...item,
          flagged_by_user: item.flags ? item.flags.some((flag: any) => flag.user_id === userData.user.id) : false
        }));
        setMyListings(mappedMyListings);
      }

      if (announcementsData) {
        setAnnouncements(announcementsData || []);
      }

    } catch (err) {
      console.error("Dashboard fetching error:", err);
      showToast("Error connecting to server. Retrying...", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Laravel Reverb WebSocket integration
  useEffect(() => {
    if (!currentUser) return;

    const echo = getEcho();
    if (!echo) return;

    // Join target user's strict private channel
    const channelName = `user.${currentUser.id}`;
    
    echo.private(channelName)
      .listen(".ResidentVerificationStatusUpdated", (data: { status: "pending" | "approved" | "rejected"; rejection_reason?: string; rejection_message?: string }) => {
        console.log("WebSocket Reverb update received:", data);
        
        // Show minimalist toast notification
        if (data.status === "approved") {
          showToast("🎉 Congratulations! Your residency profile has been verified and approved!", "success");
        } else if (data.status === "rejected") {
          const reasonText = data.rejection_reason ? `Reason: ${data.rejection_reason.replace(/_/g, " ")}` : "Please review details.";
          showToast(`⚠️ Residency verification rejected. ${reasonText}`, "error");
        }

        // Refetch data to instantly activate UI features
        fetchData();
      });

    // Subscribe to feed private channel
    echo.private('feed')
      .listen('.PostLiked', (data: { post_id: string; likes_count: number; user_id: string; liked: boolean }) => {
        console.log("Real-time PostLiked received:", data);
        if (data.user_id === currentUserRef.current?.id) return;

        setPosts(prev => prev.map(post => {
          if (post.id === data.post_id) {
            return {
              ...post,
              likes_count: data.likes_count
            };
          }
          return post;
        }));
      })
      .listen('.CommentCreated', (data: { comment: Comment }) => {
        console.log("Real-time CommentCreated received:", data);
        const { comment } = data;
        
        if (comment.user_id === currentUserRef.current?.id) return;
        
        // If comments are loaded/expanded for this post, add the comment
        setComments(prev => {
          if (prev[comment.post_id]) {
            // Avoid duplicate additions
            const exists = prev[comment.post_id].some(c => c.id === comment.id);
            if (!exists) {
              return {
                ...prev,
                [comment.post_id]: [...prev[comment.post_id], comment]
              };
            }
          }
          return prev;
        });

        // Increment comments count on the post
        setPosts(prev => prev.map(post => {
          if (post.id === comment.post_id) {
            return {
              ...post,
              comments_count: post.comments_count + 1
            };
          }
          return post;
        }));
      });

    // Cleanup channel connection on unmount
    return () => {
      echo.leave(channelName);
      echo.leave('feed');
    };
  }, [currentUser]);

  // Interaction: Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || isVerified() === false) return;
    if (postSubmittingRef.current) return;

    postSubmittingRef.current = true;
    setPostSubmitting(true);
    try {
      const response = await apiRequest("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: newPostContent.trim() }),
      });

      if (response.ok) {
        const newPost = await response.json();
        // Insert new post to top of timeline
        setPosts(prev => [newPost, ...prev]);
        setNewPostContent("");
        showToast("Post shared successfully!", "success");
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to submit post.", "error");
      }
    } catch (err) {
      showToast("Network error publishing post.", "error");
    } finally {
      postSubmittingRef.current = false;
      setPostSubmitting(false);
    }
  };

  // Load the next page of posts
  const fetchMorePosts = async () => {
    if (loadingMore || !nextPageUrl || !currentUser) return;

    setLoadingMore(true);
    try {
      let relativeEndpoint = nextPageUrl;
      if (nextPageUrl.startsWith("http://") || nextPageUrl.startsWith("https://")) {
        const url = new URL(nextPageUrl);
        relativeEndpoint = url.pathname + url.search;
      }

      const res = await apiRequest(relativeEndpoint);
      if (res.ok) {
        const postsData = await res.json();
        const mappedMorePosts = (postsData.data || []).map((post: any) => ({
          ...post,
          liked_by_user: post.likes ? post.likes.some((like: any) => like.user_id === currentUser.id) : false,
          flagged_by_user: post.flags ? post.flags.some((flag: any) => flag.user_id === currentUser.id) : false
        }));
        
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = mappedMorePosts.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });

        setCurrentPage(postsData.current_page);
        setNextPageUrl(postsData.next_page_url);
        setHasMore(!!postsData.next_page_url);
      }
    } catch (err) {
      console.error("Error fetching more posts:", err);
      showToast("Error loading more posts.", "error");
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
          fetchMorePosts();
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
  }, [hasMore, nextPageUrl, loadingMore, currentUser]);

  // Fetch comments of a post
  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await apiRequest(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [postId]: data }));
      } else {
        showToast("Failed to load comments.", "error");
      }
    } catch (err) {
      showToast("Error loading comments.", "error");
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle comments expand/collapse
  const toggleComments = (postId: string) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));
    if (isExpanded && !comments[postId]) {
      fetchComments(postId);
    }
  };

  // Interaction: Write Comment
  const handleCreateComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = commentInputs[postId]?.trim();
    if (!content || isVerified() === false) return;
    if (commentSubmittingRef.current[postId]) return;

    commentSubmittingRef.current[postId] = true;
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await apiRequest(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const newComment = await response.json();
        // Append comment locally (with duplicate check)
        setComments(prev => {
          const list = prev[postId] || [];
          const exists = list.some(c => c.id === newComment.id);
          if (exists) return prev;
          return {
            ...prev,
            [postId]: [...list, newComment]
          };
        });
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        
        // Increment comments count locally
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments_count: post.comments_count + 1
            };
          }
          return post;
        }));
        
        showToast("Comment posted!", "success");
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to post comment.", "error");
      }
    } catch (err) {
      showToast("Error publishing comment.", "error");
    } finally {
      commentSubmittingRef.current[postId] = false;
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };


  // Interaction: Like Post (with Optimistic UI Update)
  const handleToggleLike = async (postId: string) => {
    if (isVerified() === false) {
      showToast("Verification required to interact with posts.", "error");
      return;
    }

    // Find the post to toggle
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const originalLiked = targetPost.liked_by_user;
    const originalLikesCount = targetPost.likes_count;

    // Optimistically update the UI
    const nextLiked = !originalLiked;
    const nextLikesCount = nextLiked ? originalLikesCount + 1 : Math.max(0, originalLikesCount - 1);

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked_by_user: nextLiked,
          likes_count: nextLikesCount
        };
      }
      return post;
    }));

    try {
      const response = await apiRequest(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Sync with official response from server
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked_by_user: data.liked,
              likes_count: data.likes_count,
            };
          }
          return post;
        }));
      } else {
        // Revert to original state on server error
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked_by_user: originalLiked,
              likes_count: originalLikesCount,
            };
          }
          return post;
        }));
        showToast("Failed to update like. Please try again.", "error");
      }
    } catch (err) {
      // Revert to original state on network error
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked_by_user: originalLiked,
            likes_count: originalLikesCount,
          };
        }
        return post;
      }));
      showToast("Network error. Could not update like.", "error");
    }
  };

  const handleOpenFlagModal = (postId: string) => {
    if (isVerified() === false) {
      showToast("Verification required to flag posts.", "error");
      return;
    }
    setFlaggingPostId(postId);
    setFlagReason("spam");
    setFlagComment("");
    setIsFlagModalOpen(true);
  };

  const handleCloseFlagModal = () => {
    setIsFlagModalOpen(false);
    setFlaggingPostId(null);
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggingPostId || isVerified() === false) return;

    setFlagSubmitting(true);
    try {
      const response = await apiRequest(`/api/posts/${flaggingPostId}/flag`, {
        method: "POST",
        body: JSON.stringify({
          reason: flagReason,
          comment: flagComment.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "flagged") {
          // Remove the post from the feed since it's now hidden
          setPosts(prev => prev.filter(p => p.id !== flaggingPostId));
          showToast("Thank you. The post has been hidden for moderator review.", "success");
        } else {
          // Update the local flagging state
          setPosts(prev => prev.map(p => {
            if (p.id === flaggingPostId) {
              return {
                ...p,
                flagged_by_user: true,
              };
            }
            return p;
          }));
          showToast("Post reported successfully.", "success");
        }
        
        handleCloseFlagModal();
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to submit flag.", "error");
      }
    } catch (err) {
      showToast("Network error submitting report.", "error");
    } finally {
      setFlagSubmitting(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/");
  };

  const isVerified = (): boolean => {
    return currentUser?.resident_profile?.is_verified === true || currentUser?.resident_profile?.status === "approved";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const formatRejectionReason = (reason?: string) => {
    if (!reason) return "";
    return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Syncing community assets...</p>
      </div>
    );
  }

  const profile = currentUser.resident_profile;

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

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-5 shadow-sm">
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
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 transition-colors">
                🏠 Community Feed
              </Link>
              <Link href="/dashboard/marketplace" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-all">
                🛍️ Marketplace
              </Link>
              <Link href="/dashboard/business-directory" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-all">
                🏢 Business Directory
              </Link>
            </nav>

            <hr className="border-neutral-100 dark:border-zinc-800" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-all active:scale-[0.99] cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Center Timeline */}
        <main className="lg:col-span-6 space-y-6">
          
          {/* Create Post Form */}
          <form onSubmit={handleCreatePost} className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm relative overflow-hidden">
            
            {/* Read-Only overlay mask */}
            {!isVerified() && (
              <div className="absolute inset-0 bg-white/40 dark:bg-zinc-950/60 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none" />
            )}

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold text-sm shrink-0">
                {getInitials(currentUser.name)}
              </div>
              <textarea
                value={newPostContent}
                disabled={!isVerified()}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder={isVerified() ? "Share something helpful with your fellow orchard residents..." : "Residency verification pending: posting is disabled."}
                rows={3}
                className="w-full text-sm py-2 focus:outline-none bg-transparent resize-none disabled:text-slate-400 dark:disabled:text-zinc-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-zinc-800 relative z-20">
              <div className="flex gap-2">
                <button type="button" disabled={!isVerified()} className="p-2 rounded-lg text-slate-400 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent">
                  📷 Image
                </button>
              </div>
              
              <button
                type="submit"
                disabled={postSubmitting || !newPostContent.trim() || !isVerified()}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-full hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all cursor-pointer"
              >
                {postSubmitting ? "Posting..." : "Post to Feed"}
              </button>
            </div>
          </form>

          {/* Feed List */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-8 text-center text-slate-400 dark:text-zinc-400 font-light">
                No recent timeline posts found. Be the first to start the discussion!
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-6 space-y-4 shadow-sm">
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(post.user.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {post.user.name}
                          {post.user.resident_profile && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/30">
                              {post.user.resident_profile.phase} • {post.user.resident_profile.block}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                          {new Date(post.created_at).toLocaleDateString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>

                    {currentUser && post.user_id !== currentUser.id && (
                      <button
                        onClick={() => handleOpenFlagModal(post.id)}
                        disabled={post.flagged_by_user}
                        className={`p-2 rounded-lg transition-all border border-transparent ${
                          post.flagged_by_user
                            ? "text-rose-500 cursor-default opacity-80"
                            : "text-slate-400 dark:text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200/30 cursor-pointer"
                        }`}
                        title={post.flagged_by_user ? "You reported this post" : "Report post as inappropriate"}
                      >
                        <svg className="w-4 h-4" fill={post.flagged_by_user ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21v11h-7.5l-1-1H3zm0 0h11v4" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <p className="text-sm font-light leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Reaction Hooks */}
                  <div className="flex items-center gap-6 pt-3 border-t border-neutral-100 dark:border-zinc-800 text-xs">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.liked_by_user 
                          ? "text-rose-500 font-medium" 
                          : "text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      }`}
                    >
                      <svg className="w-4 h-4" fill={post.liked_by_user ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {post.likes_count} Likes
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.comments_count} Comments
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post.id] && (
                    <div className="pt-4 border-t border-neutral-100 dark:border-zinc-800 space-y-4">
                      
                      {/* Comments List */}
                      {loadingComments[post.id] && !comments[post.id] ? (
                        <div className="flex justify-center py-2">
                          <div className="w-4 h-4 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {(!comments[post.id] || comments[post.id].length === 0) ? (
                            <p className="text-[11px] text-slate-400 dark:text-zinc-400 italic font-light">
                              No comments yet. Write the first comment!
                            </p>
                          ) : (
                            comments[post.id].map(comment => (
                              <div key={comment.id} className="flex gap-2.5 items-start text-xs">
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {getInitials(comment.user.name)}
                                </div>
                                <div className="flex-1 bg-slate-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                      {comment.user.name}
                                    </span>
                                    {comment.user.resident_profile && (
                                      <span className="text-[9px] text-slate-400 dark:text-zinc-400 font-light">
                                        {comment.user.resident_profile.phase} • {comment.user.resident_profile.block}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-600 dark:text-zinc-300 font-light mt-0.5 whitespace-pre-wrap leading-normal">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Comment Input Box */}
                      {isVerified() ? (
                        <form onSubmit={(e) => handleCreateComment(post.id, e)} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            disabled={commentSubmitting[post.id]}
                            className="flex-1 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={commentSubmitting[post.id] || !commentInputs[post.id]?.trim()}
                            className="px-3 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-40"
                          >
                            {commentSubmitting[post.id] ? "..." : "Send"}
                          </button>
                        </form>
                      ) : (
                        <div className="bg-slate-50 dark:bg-zinc-800/50 border border-dashed border-neutral-200 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-400 text-center py-2 rounded-xl">
                          🔒 Verification required to write comments.
                        </div>
                      )}

                    </div>
                  )}

                </div>
              ))
            )}

            {/* Infinite Scroll Loader Target */}
            {hasMore && (
              <div ref={observerTarget} className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-light text-slate-500 dark:text-zinc-400">Loading older posts...</p>
              </div>
            )}
          </div>

        </main>

        {/* Right Section */}
        <aside className="lg:col-span-3 space-y-6">
          
          {/* Marketplace Widget */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                Classified Ads
              </span>
              <Link href="/dashboard/marketplace" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {listings.length === 0 ? (
                <div className="text-center text-xs py-4 text-slate-400 dark:text-zinc-400">
                  No active listings.
                </div>
              ) : (
                listings.map((item) => (
                  <div key={item.id} className="rounded-xl border border-neutral-100 dark:border-zinc-800 p-3 space-y-2 text-xs hover:border-neutral-300 dark:hover:border-zinc-700 transition-all">
                    <Link href={`/dashboard/marketplace/${item.id}`} className="block space-y-1 group">
                      <div className="font-bold text-emerald-600 dark:text-emerald-450 group-hover:underline">
                        PKR {Number(item.price).toLocaleString('en-US')}
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-emerald-500 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-400 truncate">{item.category}</p>
                    </Link>
                    
                    {isVerified() ? (
                      <a
                        href={`https://wa.me/${item.contact_whatsapp.replace(/\+/g, "")}?text=Hi,%20I'm%20interested%2520in%2520your%2520listing%2520${encodeURIComponent(item.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold transition-colors text-[10px]"
                      >
                        WhatsApp Seller
                      </a>
                    ) : (
                      <div className="w-full text-center py-1.5 px-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-[9px] text-slate-400 dark:text-zinc-400 font-light border border-dashed border-neutral-200 dark:border-zinc-800">
                        🔒 Verification required to view seller
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Posted Ads Widget */}
          {isVerified() && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                  My Posted Ads
                </span>
                <Link href="/dashboard/marketplace" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 hover:underline">
                  Manage Ads →
                </Link>
              </div>

              <div className="space-y-3">
                {myListings.length === 0 ? (
                  <div className="text-center text-xs py-4 text-slate-400 dark:text-zinc-400 italic font-light">
                    No ads posted yet.
                  </div>
                ) : (
                  myListings.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/dashboard/marketplace/${item.id}`}
                      className="block rounded-xl border border-neutral-100 dark:border-zinc-800 p-3 space-y-2 text-xs hover:border-neutral-300 dark:hover:border-zinc-800 transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-emerald-600 dark:text-emerald-450 group-hover:underline">
                          PKR {Number(item.price).toLocaleString('en-US')}
                        </div>
                        {item.status === "pending" ? (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200/20">
                            Under Review
                          </span>
                        ) : item.status === "sold" ? (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-400 border border-neutral-200/30">
                            Sold
                          </span>
                        ) : item.status === "active" ? (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/20">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200/20">
                            {item.status}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-emerald-500 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 dark:text-zinc-400 truncate">{item.category}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Announcements Widget */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
              Community Board
            </span>
            
            <div className="space-y-3 text-xs">
              {announcements.length === 0 ? (
                <div className="text-center text-xs py-4 text-slate-400 dark:text-zinc-400">
                  No notifications.
                </div>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="space-y-0.5 border-l-2 border-emerald-500 pl-2">
                    <div className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      {item.title}
                      {item.pinned && <span className="text-[9px] px-1 bg-amber-500/10 text-amber-600 rounded">Pin</span>}
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400 font-light text-[11px] leading-snug">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </aside>

      </div>

      {/* Flag Post Modal */}
      {isFlagModalOpen && flaggingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                🚩 Report Inappropriate Content
              </h3>
              <button 
                onClick={handleCloseFlagModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitFlag} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Why are you reporting this post?
                </label>
                <div className="relative">
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 border border-neutral-200/60 dark:border-zinc-800/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                  >
                    <option value="spam">Spam or Misleading</option>
                    <option value="harassment">Harassment or Hate Speech</option>
                    <option value="violence">Violence or Harmful Content</option>
                    <option value="inappropriate">Inappropriate or Explicit Content</option>
                    <option value="other">Other / Violation of Rules</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-zinc-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={flagComment}
                  onChange={(e) => setFlagComment(e.target.value)}
                  placeholder="Provide any details to help the moderation team understand the issue..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 border border-neutral-200/60 dark:border-zinc-800/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 resize-none font-light leading-relaxed"
                />
              </div>

              <div className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed bg-neutral-50 dark:bg-zinc-950/40 border border-neutral-200/50 dark:border-zinc-800/60 p-3 rounded-xl">
                ⚠️ <strong>Moderation Policy</strong>: Reports are logged under your resident identity and sent directly to society administrators. Submitting false reports maliciously may lead to temporary suspension.
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCloseFlagModal}
                  disabled={flagSubmitting}
                  className="px-4 py-2 border border-neutral-200/60 dark:border-zinc-800/80 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagSubmitting}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {flagSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
