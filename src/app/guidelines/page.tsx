"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { apiRequest, getAuthToken } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function CommunityGuidelinesPage() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeSection, setActiveSection] = useState("introduction");

  // Authentication check for header links
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoadingUser(false);
        return;
      }

      try {
        const res = await apiRequest("/api/user");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.log("Visitor is unauthenticated guest.");
      } finally {
        setLoadingUser(false);
      }
    };
    checkAuth();
  }, []);

  // Monitor scroll position to update active table of contents link
  useEffect(() => {
    const sections = [
      "introduction",
      "political-debates",
      "verified-resident",
      "social-feed",
      "marketplace",
      "anti-spam",
      "moderation",
      "reporting"
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.offsetTop - 100; // Offset for sticky header
      window.scrollTo({
        top,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  const sectionsList = [
    { id: "introduction", label: "Introduction" },
    { id: "political-debates", label: "1. No Political Debates" },
    { id: "verified-resident", label: "2. Resident Integrity" },
    { id: "social-feed", label: "3. Civil Feed Interaction" },
    { id: "marketplace", label: "4. Marketplace Guardrails" },
    { id: "anti-spam", label: "5. Anti-Spam & Bot Protection" },
    { id: "moderation", label: "Rule Enforcement & RBAC" },
    { id: "reporting", label: "How to Report a Violation" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200 antialiased">
      
      {/* 1. Navbar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-zinc-900 bg-white/70 dark:bg-black/60 backdrop-blur-lg transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Orchard Connect
            </Link>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100/50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/20">
              Community Center
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs hover:text-emerald-500 transition-colors font-medium">
              Home
            </Link>
            {!loadingUser && (
              user ? (
                <Link href="/dashboard" className="text-xs hover:text-emerald-500 transition-colors font-medium">
                  Portal Dashboard
                </Link>
              ) : (
                <Link href="/auth/login" className="text-xs hover:text-emerald-500 transition-colors font-medium">
                  Sign In
                </Link>
              )
            )}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme color"
              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-505 dark:text-zinc-400 transition-all active:scale-95 cursor-pointer"
            >
              {theme === "dark" ? (
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/60 dark:border-zinc-900 bg-white dark:bg-black py-16 md:py-20">
        <div className="absolute inset-0 glow-effect opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
            🤝 Trust & Safety Guidelines
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Community Rules & Guidelines
          </h1>
          <p className="text-sm md:text-base text-slate-505 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to Orchard Connect, the dedicated digital network for the residents of Bahria Orchard. To maintain a high-trust, safe, and welcoming environment for all neighbors, all registered users and visitors must strictly adhere to the following rules.
          </p>
          <div className="mt-6 text-xs text-slate-400 dark:text-zinc-555 font-mono">
            EFFECTIVE DATE: JUNE 14, 2026 | DOMAIN: ORCHARDCONNECT.PK
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-6 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* Table of Contents - Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-3">
                On This Page
              </h2>
              <nav className="space-y-1">
                {sectionsList.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                      activeSection === section.id
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 font-semibold border-l-2 border-emerald-500"
                        : "text-slate-555 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-zinc-900/50 hover:text-slate-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Policy Document Content */}
          <main className="col-span-1 lg:col-span-3 space-y-12">
            
            {/* Introduction */}
            <section id="introduction" className="space-y-4 scroll-mt-24">
              <p className="text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                Welcome to <strong className="font-semibold text-slate-900 dark:text-white">Orchard Connect</strong>. This network is designed to build bridges across our local community, keep residents informed, and offer secure P2P utility channels. Below are the rules established to keep the platform clean, safe, and respectful.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 1. Zero Tolerance for Political Debates & Discussions */}
            <section id="political-debates" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">1.</span> Zero Tolerance for Political Debates & Discussions
              </h2>
              
              <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-950 dark:text-red-200/90 text-sm space-y-3">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-xs text-red-700 dark:text-red-400">
                  🚫 Prohibited Debate Forum
                </span>
                <p className="leading-relaxed font-light">
                  Orchard Connect is a hyper-local civic space and neighborhood notice board. It is strictly <strong>NOT</strong> a forum for political discourse.
                </p>
                <div className="pl-4 border-l-2 border-red-500/30 space-y-2 text-xs">
                  <p>
                    <strong>Prohibited Content:</strong> Any posts, comments, media, or discussions regarding regional, national, or international politics, political parties, figures, elections, or ideological debates are strictly prohibited.
                  </p>
                  <p>
                    <strong>Enforcement:</strong> Any politically motivated content will be immediately archived or dropped by our moderation team, and repeat violations will lead to permanent account restrictions.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 2. Real-Name & Verified Resident Integrity */}
            <section id="verified-resident" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">2.</span> Real-Name & Verified Resident Integrity
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                To maintain high-trust interactions, we require verified identity credentials before allowing full write-access on the platform.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <span className="p-1 rounded bg-emerald-500/10 text-emerald-500 text-xs">✓</span>
                    Verification Requirement
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                    To unlock full write-access (posting, commenting, and marketplace interactions), users must successfully pass our progressive resident verification process by uploading a valid utility or maintenance bill.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <span className="p-1 rounded bg-red-500/10 text-red-500 text-xs">✕</span>
                    No Ghost Accounts
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                    Creating fake profiles, misrepresenting your property details, claiming a plot that is not yours, or using pseudonyms to troll or spy on neighbors is strictly banned.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 3. Respectful & Civil Social Feed Interaction */}
            <section id="social-feed" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">3.</span> Respectful & Civil Social Feed Interaction
              </h2>
              
              <div className="space-y-3 text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                <p>
                  We aim to cultivate a polite digital environment that mirrors neighborhood friendliness.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li>
                    <strong className="text-slate-800 dark:text-zinc-200">No Harassment or Defamation:</strong> Personal feuds, targeted harassment, offensive language, neighbor-shaming, and deceptive text or media will not be tolerated under any circumstances.
                  </li>
                  <li>
                    <strong className="text-slate-800 dark:text-zinc-200">Constructive Communication:</strong> Use the social feed and comments to share neighborhood news, utility alerts, lost-and-found items, and community event updates in a civil, respectful tone.
                  </li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 4. Decoupled Marketplace Guardrails */}
            <section id="marketplace" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">4.</span> Decoupled Marketplace Guardrails
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                The public marketplace is provided solely as a listing utility. Residents interact directly and externally.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-2">
                  <h3 className="font-bold text-xs text-slate-805 dark:text-zinc-200">Authentic Listings</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    All classified ads, product descriptions, pricing matrices, and business submissions must be accurate, authentic, and legal.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-2">
                  <h3 className="font-bold text-xs text-slate-805 dark:text-zinc-200">Peer-to-Peer Safety</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    Orchard Connect acts purely as an information bridge. Transactions and negotiations take place externally (e.g. WhatsApp or phone calls) at your own exclusive risk.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-2">
                  <h3 className="font-bold text-xs text-slate-805 dark:text-zinc-200">Prohibited Items</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    Commercial spam, illegal services, weapons, unauthorized property listings, and off-topic advertisements are banned and will be flagged by the Marketplace Moderator.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 5. Anti-Spam and Bot Protections */}
            <section id="anti-spam" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">5.</span> Anti-Spam and Bot Protections
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                We employ proactive bot defense shields to protect our administrative pipelines and database infrastructure.
              </p>
              
              <div className="pl-4 border-l-2 border-emerald-500/30 space-y-2 text-xs text-slate-655 dark:text-zinc-400">
                <p>
                  <strong>No Automated Abuse:</strong> Any attempt to flood open public submission forms, anonymous complaint systems, or support tracking modules using automated scripts or bots is strictly forbidden.
                </p>
                <p>
                  <strong>Rate Limits:</strong> The platform enforces strict backend rate-limiting throttles and hidden honeypot defenses. Users or IP addresses caught attempting to spam the system layout will face automatic, permanent device bans.
                </p>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* Rule Enforcement & Moderation Workflow */}
            <section id="moderation" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                Rule Enforcement & Moderation Workflow
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-350 font-light leading-relaxed">
                Orchard Connect utilizes a structured, 3-Tier Role-Based Access Control (RBAC) system to maintain platform decorum:
              </p>

              <div className="space-y-4 mt-6">
                
                {/* News/Content Moderators */}
                <div className="flex gap-4 items-start p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 text-xs font-bold font-mono">
                    TIER 1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Content / News Moderators</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                      Actively monitor the live social feed, manage polls, and drop or archive content/comments that violate local neighborhood guidelines.
                    </p>
                  </div>
                </div>

                {/* Marketplace Moderators */}
                <div className="flex gap-4 items-start p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 text-xs font-bold font-mono">
                    TIER 2
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Marketplace Moderators</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                      Audit public submission queues, approve safe listings, and remove expired or fraudulent ads.
                    </p>
                  </div>
                </div>

                {/* Community Admins & Superadmins */}
                <div className="flex gap-4 items-start p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 text-xs font-bold font-mono">
                    TIER 3
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Community Admins & Superadmins</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                      Handle physical onboarding verifications, manage staff permissions, address escalated neighborhood disputes, and ensure technical infrastructure safety.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* How to Report a Violation */}
            <section id="reporting" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                How to Report a Violation
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
                If you spot a post, comment, or marketplace listing that violates these rules—especially any political discussions or neighbor harassment—please instantly report it or submit a query via the{" "}
                <Link href="/support" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                  Contact Support
                </Link>{" "}
                module located in the footer of our landing page layout.
              </p>

              <div className="pt-6 border-t border-slate-100 dark:border-zinc-900 mt-6">
                <p className="text-sm italic font-medium text-emerald-700 dark:text-emerald-400">
                  Let&apos;s work together to keep our neighborhood connected, modern, and clutter-free.
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 font-mono">
                  — The Orchard Connect Team
                </p>
              </div>
            </section>

          </main>

        </div>
      </div>

      {/* 6. Footer */}
      <footer className="border-t border-slate-200/60 dark:border-zinc-900 bg-white dark:bg-black py-8 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-zinc-555">
          <div>
            © {new Date().getFullYear()} Orchard Connect. All rights reserved. Designed exclusively for Bahria Orchard residents.
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-zinc-300">Privacy Policy</Link>
            <Link href="/data-deletion" className="hover:text-slate-600 dark:hover:text-zinc-300">Data Deletion Policy</Link>
            <Link href="/terms" className="hover:text-slate-600 dark:hover:text-zinc-300">Terms of Service</Link>
            <Link href="/disclaimer" className="hover:text-slate-600 dark:hover:text-zinc-300">Disclaimer</Link>
            <Link href="/guidelines" className="hover:text-slate-600 dark:hover:text-zinc-300 font-semibold text-emerald-600 dark:text-emerald-450">Community Guidelines</Link>
            <Link href="/support" className="hover:text-slate-600 dark:hover:text-zinc-300">Contact Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
