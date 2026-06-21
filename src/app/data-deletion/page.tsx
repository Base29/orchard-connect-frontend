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

export default function DataDeletionPolicyPage() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeSection, setActiveSection] = useState("introduction");

  // Authentication check for the header links
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
      "right-to-delete",
      "content-purge",
      "instant-purge",
      "visitor-tickets",
      "oauth-deletion",
      "policy-updates",
      "contact-us"
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
    { id: "right-to-delete", label: "1. Right to Delete & Account Erasure" },
    { id: "content-purge", label: "2. Interactive & Public Content" },
    { id: "instant-purge", label: "3. Instant Document Purge" },
    { id: "visitor-tickets", label: "4. Visitor Support Tickets" },
    { id: "oauth-deletion", label: "5. Third-Party OAuth Deletion" },
    { id: "policy-updates", label: "6. Policy Updates" },
    { id: "contact-us", label: "Contact Us" }
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
              Privacy Center
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
              className="p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 transition-all active:scale-95 cursor-pointer"
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
            🛡️ Data Deletion
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Data Deletion Policy
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Learn how we enforce strict protocols regarding data retention, account erasure, and permanent document purging across all active systems of our portal.
          </p>
          <div className="mt-6 text-xs text-slate-400 dark:text-zinc-500 font-mono">
            EFFECTIVE DATE: JUNE 14, 2026
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
                        : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-zinc-900/50 hover:text-slate-800 dark:hover:text-neutral-200"
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
              <p className="text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-light font-sans">
                At <strong>Orchard Connect</strong> (<span className="text-emerald-600 dark:text-emerald-400 hover:underline">orchardconnect.pk</span>), we value the trust, security, and digital privacy of our neighborhood network. In alignment with global privacy standards (such as GDPR), our premium, decoupled architecture (Next.js and Supabase/PostgreSQL) enforces strict protocols regarding data retention and permanent data erasure. This policy clearly outlines how residents and visitors can execute their right to be forgotten and how user-generated metadata is systematically removed from our platform layers.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 1. Right to Delete and Account Erasure */}
            <section id="right-to-delete" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">1.</span> Right to Delete and Account Erasure
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                  As a registered resident or social login user (via Google or Facebook OAuth), you maintain total control over your digital footprint. You can request the permanent removal of your profile, authentication data, and platform history at any time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* How to Request */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <span className="text-xl">📩</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">How to Request Deletion</h3>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400 list-disc pl-4 leading-relaxed font-light">
                    <li>
                      <strong className="text-slate-800 dark:text-zinc-300 font-semibold">In-App Option:</strong> Access the Contact Support module located within the landing page footer of your resident dashboard.
                    </li>
                    <li>
                      <strong className="text-slate-800 dark:text-zinc-300 font-semibold">Direct Assistance:</strong> Drop a direct message specifying your account details to our portal administration desk.
                    </li>
                  </ul>
                </div>

                {/* What Happens */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                    <span className="text-xl">⚡</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">System Processing Details</h3>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400 list-disc pl-4 leading-relaxed font-light">
                    <li>
                      <strong className="text-slate-800 dark:text-zinc-300 font-semibold">Authentication Data:</strong> Your secure profile tokens and authentication mapping managed via Laravel Sanctum are permanently revoked.
                    </li>
                    <li>
                      <strong className="text-slate-800 dark:text-zinc-300 font-semibold">Core Profile Data:</strong> Your name, email address, relationship status tags, and historical metadata are deleted entirely from our cloud database layer.
                    </li>
                    <li>
                      <strong className="text-slate-800 dark:text-zinc-300 font-semibold">System Timeline:</strong> Account authentication details and user profile data will be fully purged from the live network within 24–48 hours.
                    </li>
                  </ul>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 2. Interactive & Public Content Purge */}
            <section id="content-purge" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">2.</span> Interactive & Public Content Purge
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                  When an account is deleted, your public contributions to the hyper-local ecosystem are processed as follows to preserve data isolation and community security:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Social Feed */}
                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
                  <div className="text-xl">💬</div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">The Social Feed</h3>
                  <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Posts, comments, and poll responses you actively published are completely dropped from the live feed and system indexes.
                  </p>
                </div>

                {/* Marketplace */}
                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
                  <div className="text-xl">🏷️</div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Marketplace Listings</h3>
                  <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
                    All active buy/sell classified ads, product titles, descriptions, pricing matrices, and contact phone numbers are permanently archived and dropped from public view.
                  </p>
                </div>

                {/* Media Assets */}
                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
                  <div className="text-xl">🖼️</div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Media Assets</h3>
                  <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Associated item images hosted inside our cloud storage buckets are completely cleared, ensuring zero orphaned files are hoarded on our servers.
                  </p>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 3. Automated Instant Document Purge Policy */}
            <section id="instant-purge" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">3.</span> Automated Instant Document Purge Policy
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                  To protect structural data privacy and maintain a highly secure space free from unnecessary data footprints, we enforce an absolute zero-retention policy for high-sensitivity onboarding documents once audited.
                </p>
              </div>

              <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 dark:border-emerald-500/10 overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-2xl flex-shrink-0">
                    🔒
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100">
                      The Zero-Retention Rule & Instant Purge Mechanism
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed font-light">
                      During resident onboarding, you upload a digital copy of your <strong>Bahria Electricity Bill</strong> or <strong>Maintenance Bill</strong> to verify physical residency. We do not store or retain these structural assets long-term. The exact moment an authorized Community Admin reviews your application and explicitly updates your profile status to either &quot;Approved&quot; or &quot;Rejected&quot;, an automated background webhook is instantly executed.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                      This runtime action immediately and permanently deletes the original verification file (PDF or image) from our private, encrypted cloud storage bucket. No residual data trail or orphaned documentation is left on our cloud layers. Only your normalized, verified address structure (Phase, Block, Street, and House/Plot Number) remains pinned to your resident account to ensure platform mapping validity and prevent fraudulent duplicate plot claims.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 4. Anonymous Visitor Support Tickets */}
            <section id="visitor-tickets" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">4.</span> Anonymous Visitor Support Tickets
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                  For public visitors who utilize the anonymous ticket tracker via the Contact Support page without creating a resident profile:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 space-y-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <span className="text-emerald-500">⏳</span> Tracking Lifecycle
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    Data submitted to resolve pre-signup inquiries (name, email, description) is retained solely within a private backend helpdesk queue until resolved.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 space-y-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <span className="text-red-500">🧹</span> Closure Purge
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    Once a support staff member marks the ticket as officially resolved and closed, the communication trail and tracking metrics are securely archived. General visitors can check this status using their unique reference key up until closure.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 5. Third-Party OAuth Data Deletion */}
            <section id="oauth-deletion" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">5.</span> Third-Party OAuth Data Deletion (Facebook / Google)
                </h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                  If you registered for Orchard Connect via Facebook Login or Google Sign-In and later choose to revoke access through your social media network provider account settings, our platform honors that request immediately:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Live Callback Integration</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    We maintain dedicated secure endpoints connected with social networking providers to receive remote data deletion callbacks.
                  </p>
                </div>

                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Immediate Processing</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    When Facebook or Google notifies our backend that a resident has disconnected the application, our system interprets this request automatically. The user’s associated third-party authentication ID is matched, database write capabilities are locked, and the profile records undergo standard account erasure protocols.
                  </p>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 6. Policy Updates */}
            <section id="policy-updates" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">6.</span> Policy Updates
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light font-sans">
                We reserve the right to modify this Data Deletion Policy as our community portal scales and integrates further automated civic utilities. Residents will be explicitly notified of any structural changes via an explicit announcement banner displaying on their viewport dashboards.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* Contact Us */}
            <section id="contact-us" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                Contact Us
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light font-sans">
                If you have questions regarding this policy, data privacy compliance, or platform security protocols, please access the{" "}
                <Link href="/support" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                  Contact Support
                </Link>{" "}
                link in the landing page footer or drop us a direct message.
              </p>

              <div className="pt-6 border-t border-slate-100 dark:border-zinc-900 mt-6">
                <p className="text-sm italic font-medium text-emerald-700 dark:text-emerald-400">
                  Let&apos;s build a safer, more connected neighborhood together.
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
            <Link href="/guidelines" className="hover:text-slate-600 dark:hover:text-zinc-300">Community Guidelines</Link>
            <Link href="/support" className="hover:text-slate-600 dark:hover:text-zinc-300">Contact Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
