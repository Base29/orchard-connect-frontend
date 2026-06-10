"use client";

import React, { useState, useEffect, useRef } from "react";
import NavigationCard from "@/components/NavigationCard";
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

const CATEGORIES = [
  "All",
  "Electronics",
  "Vehicles",
  "Property",
  "Fashion",
  "Home & Living",
  "Services",
  "Other"
];

export default function MarketplacePage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // User details
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Listing data
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"browse" | "my-listings">("browse");

  // Create listing modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Electronics");
  const [newPrice, setNewPrice] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);

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

  // Fetch initial profile & listings
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

  const fetchListings = async (categoryFilter = "All", query = "", userSpecific = false, userObj: User | null = null) => {
    setLoading(true);
    try {
      const activeUser = userObj || currentUser;
      let endpoint = `/api/listings?category=${categoryFilter === "All" ? "" : encodeURIComponent(categoryFilter)}&search=${encodeURIComponent(query)}`;
      if (userSpecific && activeUser) {
        endpoint += `&user_id=${activeUser.id}`;
      }

      const res = await apiRequest(endpoint);
      if (res.ok) {
        const data = await res.json();
        const activeUserId = userObj?.id || currentUser?.id;
        const mapped = (data.data || []).map((item: any) => ({
          ...item,
          flagged_by_user: item.flags ? item.flags.some((f: any) => f.user_id === activeUserId) : false
        }));
        setListings(mapped);
      } else {
        showToast("Failed to retrieve listings.", "error");
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
      showToast("Failed to connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const user = await fetchUser();
      if (user) {
        await fetchListings("All", "", false, user);
      }
    };
    initialize();
  }, []);

  // References to keep event listeners updated without resubscribing Echo
  const categoryRef = useRef(selectedCategory);
  const searchRef = useRef(searchQuery);
  const tabRef = useRef(activeTab);

  useEffect(() => {
    categoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    searchRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    tabRef.current = activeTab;
  }, [activeTab]);

  // Laravel Reverb WebSocket integration
  useEffect(() => {
    if (!currentUser) return;

    const echo = getEcho();
    if (!echo) return;

    // Join target user's strict private channel
    const channelName = `user.${currentUser.id}`;
    
    echo.private(channelName)
      .listen(".ResidentVerificationStatusUpdated", (data: { status: "pending" | "approved" | "rejected"; rejection_reason?: string; rejection_message?: string }) => {
        console.log("WebSocket Reverb update received on Marketplace:", data);
        
        // Show toast notification
        if (data.status === "approved") {
          showToast("🎉 Congratulations! Your residency profile has been verified and approved!", "success");
        } else if (data.status === "rejected") {
          const reasonText = data.rejection_reason ? `Reason: ${data.rejection_reason.replace(/_/g, " ")}` : "Please review details.";
          showToast(`⚠️ Residency verification rejected. ${reasonText}`, "error");
        }

        // Refetch user and listings context to instantly unlock ads posting
        fetchUser().then(user => {
          if (user) {
            fetchListings(categoryRef.current, searchRef.current, tabRef.current === "my-listings", user);
          }
        });
      })
      .listen(".ListingStatusUpdated", (data: { listing_id: string; status: string; title: string }) => {
        console.log("WebSocket Reverb update received on Marketplace for Listing status:", data);
        
        if (data.status === "active") {
          showToast(`🎉 Your classified ad "${data.title}" has been approved!`, "success");
        } else if (data.status === "suspended") {
          showToast(`⚠️ Your classified ad "${data.title}" has been suspended by a moderator.`, "error");
        }

        // Refetch listings context to update status badges
        fetchListings(categoryRef.current, searchRef.current, tabRef.current === "my-listings");
      });

    // Cleanup channel connection on unmount
    return () => {
      echo.leave(channelName);
    };
  }, [currentUser]);

  // Handle Search and Filter Changes
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    fetchListings(category, searchQuery, activeTab === "my-listings");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(selectedCategory, searchQuery, activeTab === "my-listings");
  };

  const handleTabChange = (tab: "browse" | "my-listings") => {
    setActiveTab(tab);
    fetchListings(selectedCategory, searchQuery, tab === "my-listings");
  };

  // Image Upload helper communicating with Laravel Headless upload endpoint
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isVerified() === false) return;

    if (newImages.length >= 3) {
      showToast("You can upload not more than 3 pictures.", "error");
      return;
    }

    setUploadingImage(true);
    setUploadProgress(10); // Start progress bar

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "listing");

      setUploadProgress(40);
      const res = await apiRequest("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      if (res.ok) {
        const data = await res.json();
        setNewImages(prev => [...prev, data.url]);
        showToast("Image uploaded successfully!", "success");
      } else {
        const errData = await res.json();
        showToast(errData.message || "Failed to upload image.", "error");
      }
    } catch (err) {
      console.error("Media upload error:", err);
      showToast("Network error uploading media.", "error");
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
  };

  // Form Submit: Post Classified Ad
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice || !newWhatsapp.trim() || !newDescription.trim() || isVerified() === false) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setCreateSubmitting(true);
    try {
      const response = await apiRequest("/api/listings", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          price: parseFloat(newPrice),
          contact_whatsapp: newWhatsapp.trim(),
          description: newDescription.trim(),
          images: newImages,
        }),
      });

      if (response.ok) {
        showToast("Classified ad posted successfully! Awaiting moderator review.", "success");
        setIsCreateModalOpen(false);
        // Reset state
        setNewTitle("");
        setNewCategory("Electronics");
        setNewPrice("");
        setNewWhatsapp("");
        setNewDescription("");
        setNewImages([]);
        
        // Auto-switch to My Ads tab and clear filters so user sees their new ad
        setActiveTab("my-listings");
        setSelectedCategory("All");
        setSearchQuery("");
        fetchListings("All", "", true);
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to submit listing.", "error");
      }
    } catch (err) {
      showToast("Network error creating classified ad.", "error");
    } finally {
      setCreateSubmitting(false);
    }
  };



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



  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-400">Syncing security handshake...</p>
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
                  <strong>Read-Only Guest State</strong> — Proof documents are pending review. Posting classified advertisements is locked.
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
          <NavigationCard currentUser={currentUser} activeKey="marketplace" variant="desktop" />
        </aside>

        {/* Center / Main Content */}
        <main className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Classifieds Marketplace</h1>
              <p className="text-xs font-light text-slate-400 dark:text-zinc-400">
                Buy and sell items within the gated society of Bahria Orchard.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex p-0.5 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-neutral-200/40 dark:border-zinc-800/80 text-xs">
                <button
                  onClick={() => handleTabChange("browse")}
                  className={`px-3.5 py-1.5 rounded-md font-semibold transition-all ${
                    activeTab === "browse" 
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  Browse Ads
                </button>
                <button
                  onClick={() => handleTabChange("my-listings")}
                  className={`px-3.5 py-1.5 rounded-md font-semibold transition-all ${
                    activeTab === "my-listings" 
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  My Ads
                </button>
              </div>

              {isVerified() && (
                <button
                  onClick={() => {
                    setNewWhatsapp(profile?.house_number ? "" : ""); // prefill if available
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>+</span> Post Classified Ad
                </button>
              )}
            </div>
          </div>

          <NavigationCard currentUser={currentUser} activeKey="marketplace" variant="mobile" />

          {/* Search and Category filters */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search item title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-850 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === category
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300/35 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-900/30"
                      : "bg-transparent text-slate-500 hover:text-slate-800 border-neutral-200/60 hover:border-neutral-300 dark:text-zinc-400 dark:border-zinc-800/80 dark:hover:border-zinc-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 dark:text-zinc-400 font-light">Retrieving active listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 py-16 text-center shadow-sm">
              <p className="text-slate-400 dark:text-zinc-400 font-light">No listings found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {listings.map((item) => {
                const imageUrl = item.images && item.images.length > 0 ? item.images[0] : null;
                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/marketplace/${item.id}`}
                    className="group bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 shadow-sm overflow-hidden flex flex-col hover:border-neutral-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
                  >
                    {/* Image thumbnail */}
                    <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-zinc-950 relative flex items-center justify-center overflow-hidden border-b border-neutral-100 dark:border-zinc-850">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <div className="text-slate-400 dark:text-zinc-500 text-2xl">🛍️</div>
                      )}
                      
                      {item.status === "pending" && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="px-3 py-1 bg-amber-500 text-white font-bold text-[10px] rounded-full uppercase tracking-wider animate-pulse">
                            Under Review
                          </span>
                        </div>
                      )}
                      
                      {item.status === "sold" && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="px-3 py-1 bg-rose-500 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-400">
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-sm group-hover:text-emerald-500 transition-colors truncate">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          PKR {Number(item.price).toLocaleString('en-US')}
                        </div>
                        {item.user?.resident_profile && (
                          <div className="text-[9px] text-slate-500 dark:text-zinc-400">
                            {item.user.resident_profile.phase} • {item.user.resident_profile.block}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* CREATE LISTING MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                🛍️ Post a Classified Advertisement
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Ad Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 14 Pro Max"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    {CATEGORIES.slice(1).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 150000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    WhatsApp Contact *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +923001234567"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Description *
                </label>
                <textarea
                  required
                  placeholder="Detail the condition, specs, age, warranty, and reason for selling..."
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-850 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 resize-none transition-colors"
                />
              </div>

              {/* Image upload zone */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Photos
                </label>
                
                <div className="grid grid-cols-4 gap-2.5">
                  {newImages.map((imgUrl, i) => (
                    <div key={i} className="relative aspect-square bg-slate-100 dark:bg-zinc-950 rounded-xl overflow-hidden border border-neutral-200/40 dark:border-zinc-800">
                      <img src={imgUrl} alt="Ad thumbnail" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-[9px] hover:bg-rose-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {newImages.length < 3 && (
                    <label className="relative aspect-square border border-dashed border-neutral-200 hover:border-emerald-500 dark:border-zinc-800 dark:hover:border-zinc-600 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-4 h-4 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[8px] text-slate-400 dark:text-zinc-400">Uploading</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-lg text-slate-400 dark:text-zinc-400">+</span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-400">Add Photo</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                {uploadProgress && (
                  <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createSubmitting}
                  className="px-4 py-2 border border-neutral-200/60 dark:border-zinc-800/80 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-neutral-300 font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || uploadingImage}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-55"
                >
                  {createSubmitting ? "Posting Ad..." : "Post Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
