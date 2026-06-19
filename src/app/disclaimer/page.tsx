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

export default function DisclaimerPage() {
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
      "civic-notice",
      "social-feed",
      "marketplace",
      "support",
      "infrastructure",
      "contact"
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
    { id: "civic-notice", label: "1. Civic Notice Board" },
    { id: "social-feed", label: "2. Social Feed Liability" },
    { id: "marketplace", label: "3. Marketplace Disclaimer" },
    { id: "support", label: "4. Complaints & Support" },
    { id: "infrastructure", label: "5. Data Infrastructure" },
    { id: "contact", label: "Contact and Support" }
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
              Disclaimer Center
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
            ⚖️ Legal Boundaries & Terms
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Platform Disclaimer
          </h1>
          <p className="text-sm md:text-base text-slate-505 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Please read this disclaimer carefully before using Orchard Connect. By accessing our hyper-local network, social feed, and community tools, you acknowledge the legal boundaries and limitations of liability.
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
                        : "text-slate-505 dark:text-zinc-400 hover:bg-slate-100/80 dark:hover:bg-zinc-900/50 hover:text-slate-800 dark:hover:text-neutral-200"
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
                Please read this Disclaimer carefully before using <strong className="font-semibold text-slate-900 dark:text-white">Orchard Connect</strong> (&ldquo;the platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By accessing or using our hyper-local network, social feed, and community tools, you acknowledge and agree to the legal boundaries and limitations of liability outlined below.
              </p>
              
              <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-900 dark:text-amber-200/90 text-sm space-y-2">
                <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ IMPORTANT CIVIC NOTICE
                </span>
                <p className="leading-relaxed font-light">
                  Orchard Connect is an independent, community-driven digital initiative. This platform is <strong>NOT</strong> officially affiliated with, endorsed by, authorized by, or in any way connected to the main corporate housing developers or the official management office of <strong>Bahria Orchard</strong>. All corporate trademarks and registered names belong to their respective legal owners.
                </p>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 1. General Information and Civic Notice Board */}
            <section id="civic-notice" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">1.</span> General Information and Civic Notice Board
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                Orchard Connect functions as a decentralized, independent community information hub and neighborhood social network for residents of Bahria Orchard. All community news, utility notifications, maintenance alerts, and directories published on the platform are provided for general informational purposes only.
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                While we strive to maintain accuracy, we do not guarantee the completeness, reliability, or real-time validity of any official or unofficial notices posted by platform administrators or moderators.
              </p>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
                <strong>Recommendation:</strong> Users are advised to independently verify critical utility or administrative announcements with official management channels before taking action.
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 2. User-Generated Content and Social Feed Liability */}
            <section id="social-feed" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">2.</span> User-Generated Content and Social Feed Liability
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                The platform features an active, real-time social interaction ecosystem powered entirely by user-generated content.
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                The views, opinions, discussions, comments, and posts actively published by registered users are strictly those of the individual authors and do not reflect the stance, beliefs, or corporate policies of the Orchard Connect administration or management team.
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                We assume zero liability or responsibility for offensive, incorrect, defamatory, or deceptive user-generated text or media. However, our active moderation team maintains the right to flag, archive, or remove content that violates local neighborhood guidelines.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 3. Decoupled Marketplace Disclaimer */}
            <section id="marketplace" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">3.</span> Decoupled Marketplace Disclaimer
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                Orchard Connect operates purely as an information bridge to facilitate local classified ads and peer-to-peer neighborhood commerce.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    No Transactional Facilitation
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                    The platform does not process payments, handle escrow, offer buyer protection, or manage fulfillment logistics. Interactions between parties occur externally through independent communication triggers, such as direct WhatsApp routing or telephone calls.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Zero Trading Liability
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                    We do not audit, verify, check, or guarantee the physical condition, safety, legality, quality, or authenticity of any item, business, property listing, or service published within the public marketplace directory. Users engage in buying, selling, or hiring at their own exclusive financial and physical risk.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 4. Anonymous Complaints and Support Tracking */}
            <section id="support" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">4.</span> Anonymous Complaints and Support Tracking
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                Our anonymous complaint forms and support tracking modules are built to offer a friction-free communication route for resolving shared community concerns.
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                While our support staff routes submitted tickets to specific backend channels for attention, the submission of a support ticket does not guarantee an immediate resolution, nor does it obligate the portal administration to execute physical structural repairs, civil adjustments, or legal interventions.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 5. Third-Party Services and Data Infrastructure */}
            <section id="infrastructure" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">5.</span> Third-Party Services and Data Infrastructure
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                Our technical framework communicates with premium external providers (including Supabase for database security, AWS S3 for asset delivery, and Resend/SendGrid for email routing).
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-light leading-relaxed">
                We are not liable for any temporary platform downtime, third-party server interruptions, security breaches originating at the vendor level, or network delays caused by technical outages originating from these cloud infrastructure providers.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* Contact and Support */}
            <section id="contact" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Contact and Support
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-light">
                If you have any questions regarding this Legal Disclaimer, or wish to report a violation of community guidelines within the marketplace or social feed, please submit a query via the{" "}
                <Link href="/support" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                  Contact Support
                </Link>{" "}
                module located in the footer of our platform landing page.
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
            <Link href="/disclaimer" className="hover:text-slate-600 dark:hover:text-zinc-300 font-semibold text-emerald-600 dark:text-emerald-450">Disclaimer</Link>
            <Link href="/guidelines" className="hover:text-slate-600 dark:hover:text-zinc-300">Community Guidelines</Link>
            <Link href="/support" className="hover:text-slate-600 dark:hover:text-zinc-300">Contact Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
