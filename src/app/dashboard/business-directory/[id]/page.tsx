"use client";

import React, { useState, useEffect } from "react";
import NavigationCard from "@/components/NavigationCard";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest, checkEmailVerification, clearAuthToken } from "@/lib/api";
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

interface DirectoryReview {
  id: string;
  user_id: string;
  directory_listing_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
    roles?: string[];
  };
}

interface DirectoryListing {
  id: string;
  category_id: number;
  name: string;
  description: string | null;
  address: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  is_verified: boolean;
  category?: {
    name: string;
  };
  reviews_count?: number;
  reviews_avg_rating?: string | number | null;
  reviews?: DirectoryReview[];
}

export default function BusinessDetailPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  // Session Profile Context
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Business Detail state
  const [business, setBusiness] = useState<DirectoryListing | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Form States
  const [formRating, setFormRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [formComment, setFormComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Toast notifications
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

  // Fetch Session Profile Context
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
      console.error("Session authentication error:", err);
      showToast("Session expired. Please sign in again.", "error");
      router.push("/auth/login");
      return null;
    }
  };

  // Fetch Single Business details
  const fetchBusinessDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/directory/${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setBusiness(data);
      } else {
        if (res.status === 404) {
          setBusiness(null);
        } else {
          showToast("Failed to retrieve business details.", "error");
        }
      }
    } catch (err) {
      console.error("Error retrieving business details:", err);
      showToast("Could not connect to the directory server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchUser().then((user) => {
        if (user) {
          fetchBusinessDetail();
        }
      });
    }
  }, [businessId]);

  // Prepopulate review form if user already reviewed this business
  useEffect(() => {
    if (business && currentUser) {
      const myRev = business.reviews?.find(rev => rev.user_id === currentUser.id) || null;
      if (myRev) {
        setFormRating(myRev.rating);
        setFormComment(myRev.comment || "");
      } else {
        setFormRating(0);
        setFormComment("");
      }
    }
  }, [business, currentUser]);

  const isVerified = (): boolean => {
    return currentUser?.email_verified_at !== null && 
      (currentUser?.resident_profile?.is_verified === true || currentUser?.resident_profile?.status === "approved");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  // Generate HSL color gradient based on business name string
  const getGradient = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 60) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 75%, 45%) 0%, hsl(${h2}, 85%, 55%) 100%)`;
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push("/");
  };

  // References to prevent concurrent submissions
  const reviewSubmittingRef = React.useRef(false);

  // Review Form Submit (Create/Update)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRating === 0 || !business) return;
    if (!checkEmailVerification(currentUser)) return;
    if (isVerified() === false) return;
    if (reviewSubmittingRef.current) return;

    reviewSubmittingRef.current = true;
    setSubmittingReview(true);
    try {
      const res = await apiRequest(`/api/directory/${businessId}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: formRating,
          comment: formComment.trim() || null,
        }),
      });

      if (res.ok) {
        showToast("Review submitted successfully!", "success");
        await fetchBusinessDetail();
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to submit review.", "error");
      }
    } catch (err) {
      showToast("Network error submitting review.", "error");
    } finally {
      reviewSubmittingRef.current = false;
      setSubmittingReview(false);
    }
  };

  // Delete User's Own Review
  const handleReviewDelete = async () => {
    if (!myExistingReview) return;
    if (!confirm("Are you sure you want to delete your review?")) return;

    setDeletingReviewId(myExistingReview.id);
    try {
      const res = await apiRequest(`/api/directory/reviews/${myExistingReview.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Review deleted successfully.", "success");
        setFormRating(0);
        setFormComment("");
        await fetchBusinessDetail();
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to delete review.", "error");
      }
    } catch (err) {
      showToast("Network error deleting review.", "error");
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Admin/Moderator Action to delete a review
  const handleAdminReviewDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? (Admin action)")) return;

    try {
      const res = await apiRequest(`/api/directory/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Review deleted by Administrator.", "success");
        await fetchBusinessDetail();
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to delete review.", "error");
      }
    } catch (err) {
      showToast("Network error deleting review.", "error");
    }
  };

  const myExistingReview = business?.reviews?.find(rev => rev.user_id === currentUser?.id) || null;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-400">Syncing business handshake...</p>
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
      {!isVerified() && profile && currentUser?.email_verified_at !== null && (
        <div className={`w-full py-3.5 px-6 border-b text-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
          profile.status === "rejected" 
            ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-450"
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
                  <strong>Read-Only Guest State</strong> — Proof documents are pending review. Access to directory contact numbers is locked.
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
              Business Directory
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
          <NavigationCard currentUser={currentUser} activeKey="business-directory" variant="desktop" />
        </aside>

        {/* Center / Main Content */}
        <main className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          
          {/* Breadcrumbs */}
          <div>
            <Link 
              href="/dashboard/business-directory" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
            >
              ← Back to Business Directory
            </Link>
          </div>

          <NavigationCard currentUser={currentUser} activeKey="business-directory" variant="mobile" />

          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-12 flex justify-center items-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400 dark:text-zinc-400">Loading business profile...</span>
              </div>
            </div>
          ) : !business ? (
            <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Business Listing Not Found</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto font-light">
                The business listing you are looking for may have been deleted, unverified, or modified.
              </p>
              <Link 
                href="/dashboard/business-directory" 
                className="inline-block mt-5 px-4 py-2 bg-emerald-500 hover:bg-emerald-650 text-white text-xs font-bold rounded-xl transition-all"
              >
                Go to Directory
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Main Profile Info Card */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Logo / Avatar Column */}
                <div className="w-full md:w-1/3 bg-slate-100 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-neutral-200/60 dark:border-zinc-800/85 min-h-[250px]">
                  {business.logo_url ? (
                    <div className="w-28 h-28 rounded-2xl overflow-hidden border border-neutral-200 dark:border-zinc-800 shadow-md">
                      <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div 
                      className="w-28 h-28 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-md"
                      style={{ background: getGradient(business.name) }}
                    >
                      {getInitials(business.name)}
                    </div>
                  )}
                </div>

                {/* Right Business Details Column */}
                <div className="flex-1 p-6 md:p-8 space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-md border border-emerald-200/20">
                        {business.category?.name || "Local Business"}
                      </span>
                      {business.is_verified && (
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-md border border-emerald-250/20">
                          ✓ Verified Business
                        </span>
                      )}
                      
                      {business.reviews_count && business.reviews_count > 0 ? (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-amber-500/10">
                          ⭐ {Number(business.reviews_avg_rating).toFixed(1)} ({business.reviews_count})
                        </span>
                      ) : (
                        <span className="text-[10px] font-light text-slate-400 dark:text-zinc-400 italic bg-slate-50 dark:bg-zinc-950 px-2.5 py-0.5 rounded-md border border-neutral-200/30 dark:border-zinc-800/30">
                          No ratings yet
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {business.name}
                    </h1>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                      About the Business
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
                      {business.description || "No description provided."}
                    </p>
                  </div>

                  <hr className="border-neutral-100 dark:border-zinc-800" />

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                      Contact & Location Details
                    </h3>
                    
                    <div className="space-y-3 text-xs font-light">
                      {business.address && (
                        <div className="text-slate-700 dark:text-zinc-300 flex items-start gap-2.5">
                          <span className="text-sm shrink-0">📍</span>
                          <div className="space-y-0.5">
                            <span className="font-semibold block text-[10px] text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Address</span>
                            <span className="leading-snug">{business.address}</span>
                          </div>
                        </div>
                      )}

                      {isVerified() ? (
                        <>
                          {business.contact_phone && (
                            <div className="text-slate-700 dark:text-zinc-300 flex items-start gap-2.5">
                              <span className="text-sm shrink-0">📞</span>
                              <div className="space-y-0.5">
                                <span className="font-semibold block text-[10px] text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Phone</span>
                                <a href={`tel:${business.contact_phone}`} className="hover:underline text-emerald-600 dark:text-emerald-455 font-medium">
                                  {business.contact_phone}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {business.whatsapp && (
                            <div className="pt-3">
                              <a
                                href={`https://wa.me/${business.whatsapp.replace(/\+/g, "")}?text=Hi%20${encodeURIComponent(business.name)},%20I%20found%20you%20on%20Orchard%20Connect.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                              >
                                💬 Message on WhatsApp
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <div 
                          onClick={() => {
                            if (currentUser && currentUser.email_verified_at === null) {
                              window.dispatchEvent(new CustomEvent("show-email-verification-modal"));
                            }
                          }}
                          className={`w-full text-center py-3.5 px-3 bg-slate-100 dark:bg-zinc-800/80 rounded-xl text-[10px] text-slate-400 dark:text-zinc-400 font-light border border-dashed border-neutral-200 dark:border-zinc-800 ${
                            currentUser && currentUser.email_verified_at === null ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors' : ''
                          }`}
                        >
                          🔒 {currentUser && currentUser.email_verified_at === null ? "Email verification required to contact business." : "Residency verification required to contact business."}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Reviews and Ratings System Section */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    Resident Reviews & Ratings
                  </h2>
                  {business.reviews_count && business.reviews_count > 0 && (
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-light">
                      Average Rating: <span className="font-bold text-slate-800 dark:text-zinc-200">{Number(business.reviews_avg_rating).toFixed(1)} / 5.0</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Review Submission Form (Gated) */}
                  <div className="lg:col-span-5 bg-slate-50/50 dark:bg-zinc-900/20 border border-neutral-200/40 dark:border-zinc-800/80 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {myExistingReview ? "✏️ Update Your Review" : "⭐ Write a Review"}
                    </h3>

                    {isVerified() ? (
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        {/* Rating Star Selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block">
                            Your Rating *
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFormRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(null)}
                                className="text-2xl transition-all duration-150 focus:outline-none cursor-pointer transform hover:scale-110"
                              >
                                <span className={star <= (hoverRating ?? formRating) ? "text-amber-500" : "text-slate-300 dark:text-zinc-700"}>
                                  ★
                                </span>
                              </button>
                            ))}
                            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 ml-1.5">
                              {formRating === 1 && "Terrible"}
                              {formRating === 2 && "Poor"}
                              {formRating === 3 && "Average"}
                              {formRating === 4 && "Very Good"}
                              {formRating === 5 && "Excellent"}
                            </span>
                          </div>
                        </div>

                        {/* Comment textarea */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider block">
                            Your Review Comment
                          </label>
                          <textarea
                            placeholder="Share details about the quality of service, pricing, and timing to help Orchard neighbors..."
                            rows={3}
                            value={formComment}
                            onChange={(e) => setFormComment(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 border border-neutral-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 resize-none transition-colors font-light leading-relaxed"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <button
                            type="submit"
                            disabled={submittingReview || formRating === 0}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            {submittingReview ? "Saving..." : myExistingReview ? "Update Review" : "Submit Review"}
                          </button>

                          {myExistingReview && (
                            <button
                              type="button"
                              onClick={handleReviewDelete}
                              disabled={deletingReviewId === myExistingReview.id}
                              className="px-3.5 py-2 border border-rose-250/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              {deletingReviewId === myExistingReview.id ? "Deleting..." : "Delete Review"}
                            </button>
                          )}
                        </div>
                      </form>
                    ) : (
                      <div 
                        onClick={() => {
                          if (currentUser && currentUser.email_verified_at === null) {
                            window.dispatchEvent(new CustomEvent("show-email-verification-modal"));
                          }
                        }}
                        className={`bg-white dark:bg-zinc-950/50 border border-dashed border-neutral-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 text-center py-5 rounded-xl font-light ${
                          currentUser && currentUser.email_verified_at === null ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors' : ''
                        }`}
                      >
                        🔒 {currentUser && currentUser.email_verified_at === null ? "Email verification required to write reviews." : "Verification required to write reviews."}
                      </div>
                    )}
                  </div>

                  {/* Reviews List Column */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                      Recent Reviews ({business.reviews?.length || 0})
                    </h3>

                    {(!business.reviews || business.reviews.length === 0) ? (
                      <p className="text-xs text-slate-400 dark:text-zinc-400 italic font-light py-6">
                        No reviews have been written for this business yet. Be the first to share your experience!
                      </p>
                    ) : (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {business.reviews.map((rev) => (
                          <div key={rev.id} className="flex gap-3 items-start text-xs border-b border-neutral-50 dark:border-zinc-800 pb-4 last:border-0 last:pb-0">
                            <div 
                              className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm border border-neutral-200/20"
                              style={{ background: getGradient(rev.user.name) }}
                            >
                              {getInitials(rev.user.name)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5 font-bold text-slate-800 dark:text-zinc-100">
                                    <span>{rev.user.name}</span>
                                    <RoleBadge roles={rev.user.roles} />
                                    {rev.user.resident_profile && (
                                      <span className="text-[9px] text-slate-400 dark:text-zinc-400 font-light">
                                        ({rev.user.resident_profile.phase} • Block {rev.user.resident_profile.block})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-amber-500 font-bold text-xs flex items-center leading-none">
                                      {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-light">
                                      {new Date(rev.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Allow deleting if admin/moderator */}
                                {rev.user_id !== currentUser.id && currentUser.status === "admin" && (
                                  <button
                                    onClick={() => handleAdminReviewDelete(rev.id)}
                                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              {rev.comment && (
                                <p className="text-slate-600 dark:text-zinc-300 font-light leading-relaxed whitespace-pre-wrap pt-0.5">
                                  {rev.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
