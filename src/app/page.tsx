"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  // Interactive mock states
  const [likes, setLikes] = useState<Record<string, number>>({ post1: 12, post2: 24 });
  const [liked, setLiked] = useState<Record<string, boolean>>({ post1: false, post2: false });
  const [feedComment, setFeedComment] = useState("");
  const [comments, setComments] = useState<Array<{ id: number; author: string; block: string; content: string }>>([
    { id: 1, author: "Ahmad Raza", block: "Phase 1 - Block G", content: "Great initiative! Really clean interface." },
    { id: 2, author: "Sarah Khan", block: "Phase 2 - Block D", content: "Looking forward to buying groceries locally!" }
  ]);

  const toggleLike = (postId: string) => {
    const isLiked = liked[postId];
    setLiked({ ...liked, [postId]: !isLiked });
    setLikes({ ...likes, [postId]: isLiked ? likes[postId] - 1 : likes[postId] + 1 });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        author: "Me (Verified Resident)",
        block: "Phase 1 - Block A",
        content: feedComment.trim()
      }
    ]);
    setFeedComment("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. Header component */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Orchard Connect
            </span>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100/50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/30">
              Bahria Orchard
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-all active:scale-95 border border-transparent hover:border-neutral-200/50 dark:hover:border-zinc-800"
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

            {/* Traditional Session Trigger */}
            <a
              href="/auth/login"
              className="text-sm font-medium px-4 py-2 rounded-full border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Log In
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero and Previews Section */}
      <main className="flex-1 w-full">
        
        {/* Main Hero Split Area */}
        <section className="max-w-7xl mx-auto px-6 pt-4 pb-12 md:pt-6 md:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-start">
          
          {/* Left Side: Pitch and Snappy Value Checklist */}
          <div className="lg:col-span-7 space-y-8 lg:pr-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-100/50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/30 w-fit">
                <span>🔒 Gated Resident Network</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6.5xl font-extrabold tracking-tight leading-tight select-none">
                Connecting the heart of <br />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
                  Bahria Orchard
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-600 dark:text-zinc-400 max-w-md font-light leading-relaxed">
                The secure resident network for Bahria Orchard. Share updates, trade goods, and stay connected with verified neighbors.
              </p>
            </div>

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a 
                href="/auth/login" 
                className="flex items-center justify-center px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-sm font-semibold tracking-tight shadow-md shadow-emerald-500/5 hover:shadow-emerald-500/10 active:scale-95 transition-all duration-200 text-center cursor-pointer"
              >
                Enter Platform
              </a>
              <a 
                href="#features" 
                className="flex items-center justify-center px-8 py-3.5 rounded-full bg-transparent hover:bg-neutral-100 dark:hover:bg-zinc-900/50 text-slate-700 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-800/80 text-sm font-semibold tracking-tight active:scale-95 transition-all duration-200 text-center cursor-pointer"
              >
                Explore Features
              </a>
            </div>

            {/* Snappy Value Checklist (Adjusted Layout Space Utilizer) */}
            <div className="pt-6 border-t border-neutral-200/60 dark:border-zinc-900 space-y-3.5 max-w-md select-none">
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="text-sm text-slate-600 dark:text-zinc-400 font-light">Real-time local announcements & discussions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="text-sm text-slate-600 dark:text-zinc-400 font-light">Verified resident directory with gated credentials</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span className="text-sm text-slate-600 dark:text-zinc-400 font-light">Direct WhatsApp routing for peer-to-peer trade</span>
              </div>
            </div>
          </div>

          {/* Right Side: Social Timeline and Marketplace Interactive Previews */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Feed Preview Component */}
            <div className="rounded-2xl glass-panel border border-neutral-200/60 dark:border-zinc-800/80 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  💬 Community Feed Preview
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Live Demo</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>
              </div>

              {/* Post Card */}
              <div className="space-y-3 pb-4 border-b border-neutral-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    UM
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      Usman Malik
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/30">
                        Phase 1 • Blk C
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-zinc-500">12 minutes ago</div>
                  </div>
                </div>
                
                <p className="text-sm font-light leading-relaxed text-slate-700 dark:text-zinc-300">
                  Are there any scheduled water maintenance shifts planned for Block C this afternoon? Pressure is slightly lower than normal.
                </p>

                {/* Interaction Buttons */}
                <div className="flex items-center gap-4 text-xs select-none">
                  <button
                    onClick={() => toggleLike("post1")}
                    className={`flex items-center gap-1.5 transition-colors duration-150 active:scale-95 ${liked.post1 ? "text-rose-500 font-semibold" : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400"}`}
                  >
                    <svg className="w-4 h-4" fill={liked.post1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {likes.post1} Likes
                  </button>
                  <span className="text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {comments.length} Comments
                  </span>
                </div>
              </div>

              {/* Comment Thread */}
              <div className="space-y-3 pl-4 border-l border-neutral-100 dark:border-zinc-800 max-h-36 overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="text-xs space-y-0.5 animate-fadeIn">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{comment.author}</span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500">{comment.block}</span>
                    </div>
                    <p className="font-light text-slate-600 dark:text-zinc-400">{comment.content}</p>
                  </div>
                ))}
              </div>

              {/* Interactive Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={feedComment}
                  onChange={(e) => setFeedComment(e.target.value)}
                  placeholder="Write a supportive reply..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-neutral-100 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Marketplace Preview Component */}
            <div className="rounded-2xl glass-panel border border-neutral-200/60 dark:border-zinc-800/80 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  🛍️ Marketplace Listings
                </span>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Verified Ads</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ad Card 1 */}
                <div className="rounded-xl border border-neutral-100 dark:border-zinc-800/80 p-4 space-y-3 bg-white/50 dark:bg-zinc-900/30 hover:border-neutral-200 dark:hover:border-zinc-700 transition-colors duration-200 group">
                  <div className="aspect-[4/3] bg-neutral-100/80 dark:bg-zinc-950 rounded-lg flex items-center justify-center text-xs text-neutral-400 dark:text-zinc-600 select-none overflow-hidden relative">
                    <span className="group-hover:scale-110 transition-transform duration-300">📷 10-Marla Plot Visuals</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">PKR 7,500,000</div>
                    <h3 className="text-sm font-semibold tracking-tight truncate text-slate-800 dark:text-zinc-200">Prime 10 Marla Plot</h3>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Block G, Near Safari Garden</p>
                  </div>
                  
                  {/* Secure WhatsApp Clicker */}
                  <a
                    href="https://wa.me/923001234567?text=Hi%20Usman,%20I%20am%20interested%20in%20your%2010%20Marla%20Plot%20listed%20on%20Orchard%20Connect."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all duration-150 active:scale-[0.98] shadow-sm shadow-[#25D366]/10"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.09-3.79c1.624.966 3.23 1.488 4.96 1.489 5.485 0 9.948-4.467 9.95-9.95.002-2.658-1.03-5.155-2.906-7.03C16.324 2.847 13.827 1.815 11.99 1.815c-5.495 0-9.959 4.467-9.962 9.953-.001 1.76.47 3.479 1.365 5.01L2.348 21.65l4.8-.84z" />
                    </svg>
                    WhatsApp Seller
                  </a>
                </div>

                {/* Ad Card 2 */}
                <div className="rounded-xl border border-neutral-100 dark:border-zinc-800/80 p-4 space-y-3 bg-white/50 dark:bg-zinc-900/30 hover:border-neutral-200 dark:hover:border-zinc-700 transition-colors duration-200 group">
                  <div className="aspect-[4/3] bg-neutral-100/80 dark:bg-zinc-950 rounded-lg flex items-center justify-center text-xs text-neutral-400 dark:text-zinc-600 select-none overflow-hidden relative">
                    <span className="group-hover:scale-110 transition-transform duration-300">📷 Laptop Graphics</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">PKR 85,000</div>
                    <h3 className="text-sm font-semibold tracking-tight truncate text-slate-800 dark:text-zinc-200">HP EliteBook 840 G8</h3>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Core i7, 16GB RAM, 512GB SSD</p>
                  </div>
                  
                  {/* Secure WhatsApp Clicker */}
                  <a
                    href="https://wa.me/923001112223?text=Hi,%20I%20am%20interested%20in%20your%20HP%20EliteBook%20laptop%20listed%20on%20Orchard%20Connect."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all duration-150 active:scale-[0.98] shadow-sm shadow-[#25D366]/10"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.09-3.79c1.624.966 3.23 1.488 4.96 1.489 5.485 0 9.948-4.467 9.95-9.95.002-2.658-1.03-5.155-2.906-7.03C16.324 2.847 13.827 1.815 11.99 1.815c-5.495 0-9.959 4.467-9.962 9.953-.001 1.76.47 3.479 1.365 5.01L2.348 21.65l4.8-.84z" />
                    </svg>
                    WhatsApp Seller
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Key Platform Pillars Section */}
        <section id="features" className="w-full border-t border-neutral-200/40 dark:border-zinc-900 bg-white/40 dark:bg-zinc-900/10 backdrop-blur-md py-20 md:py-28 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Unified Ecosystem
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Designed Exclusively for Bahria Orchard
              </h2>
              <p className="text-base text-slate-600 dark:text-zinc-400 font-light leading-relaxed">
                A secure space where convenience meets neighborhood connection. No spam, no anonymous trolling—only verified local interactions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              <div className="p-8 rounded-2xl bg-white/50 dark:bg-zinc-900/40 border border-neutral-200/50 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform duration-200">
                  💬
                </div>
                <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Community Feed
                </h3>
                <p className="text-sm font-light text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Share neighborhood updates, ask questions about water shifts or maintenance, and respond to community news in a real-time verified timeline.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-8 rounded-2xl bg-white/50 dark:bg-zinc-900/40 border border-neutral-200/50 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform duration-200">
                  🛍️
                </div>
                <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  P2P Marketplace
                </h3>
                <p className="text-sm font-light text-slate-600 dark:text-zinc-400 leading-relaxed">
                  List plots, laptops, or cars directly to neighbors. Built-in WhatsApp routing lets buyers secure purchases instantly, ensuring safe, direct cash-on-delivery transactions.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-8 rounded-2xl bg-white/50 dark:bg-zinc-900/40 border border-neutral-200/50 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform duration-200">
                  🛡️
                </div>
                <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Address Verification
                </h3>
                <p className="text-sm font-light text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Every profile is locked to an active Phase and Block inside Bahria Orchard. Enjoy peace of mind knowing you are engaging with real, verified neighbors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Bottom Join CTA Section */}
        <section className="w-full border-t border-neutral-200/40 dark:border-zinc-900 bg-gradient-to-b from-white to-neutral-50 dark:from-zinc-950 dark:to-black py-20 relative overflow-hidden transition-colors duration-200">
          <div className="absolute inset-0 glow-effect opacity-50 dark:opacity-20 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-zinc-100 leading-tight">
              Ready to Connect with Bahria Orchard?
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-zinc-400 max-w-xl mx-auto font-light leading-relaxed">
              Join over 1,200 verified residents today. Access local marketplace deals, join safety timelines, and find trusted local services.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <a
                href="/auth/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center cursor-pointer"
              >
                Get Verified Access
              </a>
              <a
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-neutral-100 border border-neutral-200 dark:border-zinc-800 font-semibold active:scale-95 transition-all text-center cursor-pointer"
              >
                Try Resident Demo
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-neutral-100 dark:border-zinc-900 bg-white dark:bg-black py-8 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-zinc-500">
          <div>
            © {new Date().getFullYear()} Orchard Connect. All rights reserved. Designed exclusively for Bahria Orchard residents.
          </div>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-slate-600 dark:hover:text-zinc-300">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-600 dark:hover:text-zinc-300">Terms of Service</a>
            <a href="/support" className="hover:text-slate-600 dark:hover:text-zinc-300">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
