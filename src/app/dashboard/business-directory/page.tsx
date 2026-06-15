"use client";

import React, { useState, useEffect } from "react";
import NavigationCard from "@/components/NavigationCard";
import NotificationBell from "@/components/NotificationBell";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, clearAuthToken } from "@/lib/api";

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
  reviews_count?: number;
  reviews_avg_rating?: string | number | null;
}

interface DirectoryCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  listings: DirectoryListing[];
}

export default function BusinessDirectoryPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Authentication Context
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Directory Data
  const [categories, setCategories] = useState<DirectoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive UI Filters
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showOnlyVerified, setShowOnlyVerified] = useState<boolean>(false);

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

  // Fetch Directory Listings
  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/directory");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        showToast("Failed to retrieve business directory.", "error");
      }
    } catch (err) {
      console.error("Error retrieving directory data:", err);
      showToast("Could not connect to the directory server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const user = await fetchUser();
      if (user) {
        await fetchDirectory();
      }
    };
    initialize();
  }, []);

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

  // 1. Gather all listings from the categories
  const allListings = categories.flatMap(cat => 
    cat.listings.map(listing => ({
      ...listing,
      categoryName: cat.name,
      categorySlug: cat.slug
    }))
  );

  // 2. Apply filters
  const filteredListings = allListings.filter(listing => {
    // Category slug filter
    if (selectedCategorySlug !== "all" && listing.categorySlug !== selectedCategorySlug) {
      return false;
    }

    // Search query filter (matches business name, description, address, or category name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = listing.name.toLowerCase().includes(query);
      const descMatch = listing.description?.toLowerCase().includes(query) ?? false;
      const addrMatch = listing.address?.toLowerCase().includes(query) ?? false;
      const catMatch = listing.categoryName.toLowerCase().includes(query);
      
      if (!nameMatch && !descMatch && !addrMatch && !catMatch) {
        return false;
      }
    }

    // Verified only filter
    if (showOnlyVerified && !listing.is_verified) {
      return false;
    }

    return true;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-400">Syncing directory logs...</p>
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
          <NavigationCard currentUser={currentUser} activeKey="business-directory" variant="desktop" />
        </aside>

        {/* Center / Main Content */}
        <main className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          
          {/* Header Row */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Business Directory</h1>
            <p className="text-xs font-light text-slate-400 dark:text-zinc-400">
              Browse and connect with verified local utilities, clinics, shops, and services inside Bahria Orchard.
            </p>
          </div>

          <NavigationCard currentUser={currentUser} activeKey="business-directory" variant="mobile" />

          {/* Search bar & Verified Filter */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search businesses by name, details, or street location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400">
                  🔍
                </span>
              </div>
              
              <button
                onClick={() => setShowOnlyVerified(prev => !prev)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  showOnlyVerified
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300/35 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                    : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-350 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                }`}
              >
                🛡️ {showOnlyVerified ? "Showing Verified Only" : "Show Verified Only"}
              </button>
            </div>

            {/* Category selection bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-neutral-100 dark:border-zinc-850 pt-4">
              <button
                onClick={() => setSelectedCategorySlug("all")}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategorySlug === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-300 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                }`}
              >
                All Businesses ({allListings.length})
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategorySlug(category.slug)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategorySlug === category.slug
                      ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                      : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-350 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                  }`}
                >
                  {category.name} ({category.listings.length})
                </button>
              ))}
            </div>
          </div>

          {/* Directory Listings Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2.5">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 dark:text-zinc-400 font-light">Loading community directory lists...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 py-20 text-center shadow-sm">
              <p className="text-slate-400 dark:text-zinc-400 text-sm font-light">No local businesses found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map((business) => (
                <Link
                  key={business.id}
                  href={`/dashboard/business-directory/${business.id}`}
                  className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 shadow-sm p-5 flex flex-col justify-between hover:border-neutral-350 dark:hover:border-zinc-700 transition-all cursor-pointer"
                >
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="flex gap-3.5 items-start">
                      {/* Logo fallback or image */}
                      {business.logo_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-850 shrink-0">
                          <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm"
                          style={{ background: getGradient(business.name) }}
                        >
                          {getInitials(business.name)}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider bg-slate-50 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-neutral-200/30 dark:border-zinc-800/50">
                            {business.categoryName}
                          </span>
                          {business.is_verified && (
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-200/20">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm group-hover:text-emerald-500 transition-colors">
                          {business.name}
                        </h3>
                        {/* Rating row */}
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                          {business.reviews_count && business.reviews_count > 0 ? (
                            <>
                              <span className="text-amber-500 font-bold flex items-center">
                                ⭐ {Number(business.reviews_avg_rating).toFixed(1)}
                              </span>
                              <span className="text-slate-400 dark:text-zinc-400">
                                ({business.reviews_count} {business.reviews_count === 1 ? 'review' : 'reviews'})
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-400 text-[10px] italic font-light">
                              No reviews yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-zinc-400 font-light leading-relaxed line-clamp-3">
                      {business.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-zinc-800 mt-4 text-xs font-light">
                    {/* Address details */}
                    {business.address && (
                      <div className="text-slate-500 dark:text-zinc-400 flex items-start gap-1.5">
                        <span className="shrink-0 text-sm">📍</span>
                        <span className="leading-snug line-clamp-1">{business.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center justify-end gap-1">
                      View Details →
                    </div>
                </Link>
              ))}
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
