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

interface Comment {
  id: string;
  listing_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
  };
}

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  contact_whatsapp: string;
  status: "active" | "pending" | "sold" | "flagged" | "suspended";
  created_at: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
  };
  flags?: any[];
  flagged_by_user?: boolean;
}

export default function ListingDetailPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  // Current logged in user context
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Listing data
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Comments feed states
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Flagging/Report states
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("spam");
  const [flagComment, setFlagComment] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  // Toast notification
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

  // Fetch logged in user details
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
      console.error("Auth context fetch failed:", err);
      showToast("Session expired. Please sign in again.", "error");
      router.push("/auth/login");
      return null;
    }
  };

  // Fetch listing detail
  const fetchListingDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/listings/${listingId}`);
      if (res.ok) {
        const data = await res.json();
        // Determine flagged state based on user flags relation
        const userRes = await apiRequest("/api/user");
        let activeUserId = "";
        if (userRes.ok) {
          const uData = await userRes.json();
          activeUserId = uData.user?.id || "";
        }
        
        const flagged_by_user = data.flags ? data.flags.some((f: any) => f.user_id === activeUserId) : false;
        
        setListing({
          ...data,
          flagged_by_user
        });
      } else {
        if (res.status === 404) {
          setListing(null);
        } else {
          showToast("Failed to retrieve listing details.", "error");
        }
      }
    } catch (err) {
      console.error("Error retrieving listing details:", err);
      showToast("Network error retrieving listing details.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await apiRequest(`/api/listings/${listingId}/comments`);
      if (res.ok) {
        const commentsData = await res.json();
        setComments(commentsData);
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
    if (listingId) {
      fetchUser().then((user) => {
        if (user) {
          fetchListingDetail();
          fetchComments();
        }
      });
    }
  }, [listingId]);

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

  // Add Comment handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !listing || isVerified() === false) return;

    setCommentSubmitting(true);
    try {
      const res = await apiRequest(`/api/listings/${listingId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newCommentText.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setNewCommentText("");
        showToast("Comment posted!", "success");
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to submit comment.", "error");
      }
    } catch (err) {
      showToast("Network error submitting comment.", "error");
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Toggle Sold status handler
  const handleToggleSold = async () => {
    if (!listing) return;
    const nextStatus = listing.status === "active" ? "sold" : "active";
    try {
      const res = await apiRequest(`/api/listings/${listing.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        showToast(`Listing marked as ${nextStatus}!`, "success");
        setListing(prev => prev ? { ...prev, status: updated.status } : null);
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to update status.", "error");
      }
    } catch (err) {
      showToast("Network error updating status.", "error");
    }
  };

  // Delete Listing handler
  const handleDeleteListing = async () => {
    if (!listing) return;
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;

    try {
      const res = await apiRequest(`/api/listings/${listing.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Listing deleted successfully.", "success");
        setTimeout(() => {
          router.push("/dashboard/marketplace");
        }, 1000);
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to delete listing.", "error");
      }
    } catch (err) {
      showToast("Network error deleting listing.", "error");
    }
  };

  // Flag/Report handlers
  const handleOpenFlagModal = () => {
    if (!listing) return;
    if (isVerified() === false) {
      showToast("Verification required to report listings.", "error");
      return;
    }
    setFlagReason("spam");
    setFlagComment("");
    setIsFlagModalOpen(true);
  };

  const handleCloseFlagModal = () => {
    setIsFlagModalOpen(false);
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || isVerified() === false) return;

    setFlagSubmitting(true);
    try {
      const response = await apiRequest(`/api/listings/${listing.id}/flag`, {
        method: "POST",
        body: JSON.stringify({
          reason: flagReason,
          comment: flagComment.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setListing(prev => prev ? { ...prev, flagged_by_user: true, status: data.status } : null);

        if (data.status === "flagged") {
          showToast("Listing has been hidden for moderator review.", "success");
          setTimeout(() => {
            router.push("/dashboard/marketplace");
          }, 1500);
        } else {
          showToast("Classified ad reported successfully.", "success");
        }
        handleCloseFlagModal();
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to submit report.", "error");
      }
    } catch (err) {
      showToast("Network error submitting report.", "error");
    } finally {
      setFlagSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const profile = currentUser.resident_profile;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast notifications */}
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
        <div className="w-full py-3.5 px-6 border-b text-xs flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <span className="text-sm">🔒</span>
            <p className="font-light">
              <strong>Guest State</strong> — Proof documents are pending review. Posting classified advertisements is locked.
            </p>
          </div>
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
              Classifieds Marketplace
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
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-755 dark:text-neutral-350 flex items-center justify-center font-bold text-sm">
                {getInitials(currentUser.name)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold">{currentUser.name}</div>
                {profile && (
                  <div className="text-[10px] text-slate-400">
                    {profile.phase} • Blk {profile.block}
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
              <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
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
              <Link href="/dashboard/marketplace" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 transition-colors">
                🛍️ Marketplace
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 transition-all">
                📞 Local Directory
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

        {/* Center / Main Content */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* Breadcrumbs */}
          <div>
            <Link 
              href="/dashboard/marketplace" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-450 hover:underline transition-colors"
            >
              ← Back to Marketplace
            </Link>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-12 flex justify-center items-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 font-light">Loading listing details...</span>
              </div>
            </div>
          ) : !listing ? (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">🛍️</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Listing Not Found</h2>
              <p className="text-xs text-slate-455 dark:text-zinc-500 mt-1 max-w-sm mx-auto font-light">
                The ad you are looking for may have been deleted, marked as sold, or flagged by the community for moderator review.
              </p>
              <Link 
                href="/dashboard/marketplace" 
                className="inline-block mt-5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all"
              >
                Go to Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Core Layout Grid */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Column: Image Slider */}
                <div className="w-full md:w-1/2 bg-slate-100 dark:bg-zinc-950 flex flex-col justify-between p-6 border-b md:border-b-0 md:border-r border-neutral-200/60 dark:border-zinc-800/85">
                  <div className="flex-1 flex items-center justify-center relative aspect-[4/3] md:aspect-auto min-h-[300px] overflow-hidden rounded-2xl bg-slate-200/40 dark:bg-zinc-900/50">
                    {listing.images && listing.images.length > 0 ? (
                      <>
                        <img 
                          src={listing.images[activeImageIndex]} 
                          alt={listing.title}
                          className="w-full h-full object-contain max-h-[400px] transition-all duration-300" 
                        />
                        
                        {/* Navigation Arrows */}
                        {listing.images.length > 1 && (
                          <>
                            <button
                              onClick={() => setActiveImageIndex(prev => (prev === 0 ? listing.images!.length - 1 : prev - 1))}
                              className="absolute left-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-sm hover:bg-black/60 transition-colors"
                            >
                              ‹
                            </button>
                            <button
                              onClick={() => setActiveImageIndex(prev => (prev === listing.images!.length - 1 ? 0 : prev + 1))}
                              className="absolute right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center text-sm hover:bg-black/60 transition-colors"
                            >
                              ›
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-350 text-5xl">🛍️</div>
                    )}
                  </div>

                  {/* Thumbnail Dots */}
                  {listing.images && listing.images.length > 1 && (
                    <div className="flex gap-1.5 justify-center mt-4">
                      {listing.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            activeImageIndex === i ? "bg-emerald-500 w-4" : "bg-slate-300 dark:bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Listing Details */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                  <div className="space-y-5">
                    
                    {/* Header Info: Category & Badges */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-md border border-emerald-200/20">
                            {listing.category}
                          </span>
                          
                          {listing.status === "pending" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-250/20">
                              Under Review
                            </span>
                          )}
                          {listing.status === "sold" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-805 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-200/20">
                              Sold
                            </span>
                          )}
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                          {listing.title}
                        </h1>
                      </div>
                      
                      {/* Flag button */}
                      {isVerified() && listing.user_id !== currentUser?.id && (
                        <button
                          onClick={handleOpenFlagModal}
                          disabled={listing.flagged_by_user}
                          title={listing.flagged_by_user ? "You flagged this ad" : "Report ad"}
                          className={`p-2 rounded-xl border transition-all active:scale-95 shrink-0 ${
                            listing.flagged_by_user
                              ? "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 opacity-60 cursor-not-allowed"
                              : "bg-white border-neutral-200 text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-rose-450 dark:hover:border-rose-900/30 cursor-pointer"
                          }`}
                        >
                          🚩
                        </button>
                      )}
                    </div>

                    {/* Formatted Price */}
                    <div className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      PKR {Number(listing.price).toLocaleString('en-US')}
                    </div>

                    <hr className="border-neutral-100 dark:border-zinc-800" />

                    {/* Seller Detail Card */}
                    <div className="bg-slate-50 dark:bg-zinc-950/40 border border-neutral-150/40 dark:border-zinc-850 p-4 rounded-2xl flex gap-3.5 items-center text-xs">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-250/20">
                        {getInitials(listing.user.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-zinc-100">{listing.user.name}</span>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            ✓ Verified Seller
                          </span>
                        </div>
                        {listing.user.resident_profile && (
                          <div className="text-[10px] text-slate-400 font-light mt-0.5">
                            House {listing.user.resident_profile.house_number}, {listing.user.resident_profile.phase} • Block {listing.user.resident_profile.block}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                        Description
                      </h3>
                      <p className="text-xs text-slate-650 dark:text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
                        {listing.description}
                      </p>
                    </div>

                    <hr className="border-neutral-100 dark:border-zinc-800" />

                    {/* Contact Button */}
                    {isVerified() ? (
                      <a
                        href={`https://wa.me/${listing.contact_whatsapp.replace(/\+/g, "")}?text=Hi,%20I'm%20interested%2520in%2520your%2520listing%2520${encodeURIComponent(listing.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold transition-all text-xs text-center active:scale-98 shadow-sm cursor-pointer"
                      >
                        💬 WhatsApp Seller
                      </a>
                    ) : (
                      <div className="w-full text-center py-3 px-3 bg-slate-100 dark:bg-zinc-800/80 rounded-xl text-[10px] text-slate-400 dark:text-zinc-500 font-light border border-dashed border-neutral-200 dark:border-zinc-850">
                        🔒 Residency verification required to contact seller.
                      </div>
                    )}
                  </div>

                  {/* Owner Actions */}
                  {currentUser && (listing.user_id === currentUser.id || currentUser.status === "admin") && (
                    <div className="flex gap-3 pt-6 mt-6 border-t border-neutral-100 dark:border-zinc-800 justify-between items-center">
                      <button
                        onClick={handleToggleSold}
                        className="flex-1 py-2.5 px-3 border border-neutral-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-300 font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        {listing.status === "active" ? "Mark as Sold" : "Re-activate Listing"}
                      </button>
                      
                      <button
                        onClick={handleDeleteListing}
                        className="py-2.5 px-5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        Delete Ad
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Discussion Thread (Comments) */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 space-y-4">
                <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Public Q&A / Discussion Thread
                </h2>

                {/* Comment Feed */}
                {loadingComments ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-light py-2">
                    No public questions yet. Ask the seller something about this product!
                  </p>
                ) : (
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-3 items-start text-xs border-b border-neutral-50 dark:border-zinc-850 pb-3 last:border-0 last:pb-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-neutral-200/30 dark:border-zinc-700/30">
                          {getInitials(c.user.name)}
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-zinc-950/40 rounded-2xl px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 dark:text-zinc-100">{c.user.name}</span>
                            {c.user.resident_profile && (
                              <span className="text-[9px] text-slate-400 font-light">
                                {c.user.resident_profile.phase} • Block {c.user.resident_profile.block}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-zinc-350 mt-1 font-light leading-relaxed whitespace-pre-wrap">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gated Comment Form */}
                {isVerified() ? (
                  <form onSubmit={handleAddComment} className="flex gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Ask seller a public question..."
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
                      {commentSubmitting ? "Sending..." : "Ask Question"}
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-50 dark:bg-zinc-950/50 border border-dashed border-neutral-200 dark:border-zinc-850 text-xs text-slate-455 text-center py-3 rounded-xl">
                    🔒 Residency verification is required to participate in discussions.
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Flag Listing Modal */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-805 dark:text-neutral-100 flex items-center gap-2">
                ⚠️ Report Classified Ad
              </h3>
              <button 
                onClick={handleCloseFlagModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFlag} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Reason for Reporting
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 border border-neutral-250/50 dark:border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="spam">Spam / Duplicate listing</option>
                  <option value="harassment">Harassment or Abuse</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="inappropriate">Inappropriate Content / Illegal Item</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Additional Details
                </label>
                <textarea
                  placeholder="Provide more context for moderators (optional)..."
                  value={flagComment}
                  onChange={(e) => setFlagComment(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 border border-neutral-250/50 dark:border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors resize-none font-light leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseFlagModal}
                  disabled={flagSubmitting}
                  className="px-4 py-2 border border-neutral-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors disabled:opacity-55 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagSubmitting}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-55 cursor-pointer"
                >
                  {flagSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
