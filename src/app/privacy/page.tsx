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

export default function PrivacyPolicyPage() {
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
      "info-collect",
      "data-protection",
      "auto-purge",
      "role-isolation",
      "spam-protection",
      "third-party",
      "user-rights",
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
    { id: "info-collect", label: "1. Information We Collect" },
    { id: "data-protection", label: "2. Data Protection & Security" },
    { id: "auto-purge", label: "3. 30-Day Auto-Purge" },
    { id: "role-isolation", label: "4. Role-Based Access" },
    { id: "spam-protection", label: "5. Spam & Bot Protection" },
    { id: "third-party", label: "6. Third-Party Services" },
    { id: "user-rights", label: "7. Your Rights & Control" },
    { id: "policy-updates", label: "8. Policy Updates" },
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
            🛡️ Privacy Compliance
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm md:text-base text-slate-505 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Welcome to Orchard Connect (orchardconnect.pk). Learn how we collect, protect, utilize, and eventually purge your information to build a trusted community space.
          </p>
          <div className="mt-6 text-xs text-slate-400 dark:text-zinc-555 font-mono">
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
              <p className="text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                Welcome to <strong className="font-semibold text-slate-900 dark:text-white">Orchard Connect</strong> (<span className="text-emerald-600 dark:text-emerald-400 hover:underline">orchardconnect.pk</span>). We are committed to building a trusted, secure, and transparent digital space for the residents of Bahria Orchard. This Privacy Policy outlines how we collect, protect, utilize, and eventually purge your information when you interact with our platform.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 1. Information We Collect */}
            <section id="info-collect" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">1.</span> Information We Collect
                </h2>
                <p className="text-sm text-slate-555 dark:text-zinc-400 font-light leading-relaxed">
                  To maintain a high-trust neighborhood social network while minimizing unnecessary data footprints, we collect information across three distinct levels:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                
                {/* Level A */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold">A</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Account Registration & Social Sign-In</h3>
                  </div>
                  <div className="pl-8 space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                    <p>
                      <strong className="text-slate-805 dark:text-zinc-300 font-semibold">Authentication Data:</strong> When you register or log in using social networks (Google or Facebook), we securely receive your authenticated name, email address, and profile token via Laravel Sanctum.
                    </p>
                    <p>
                      <strong className="text-slate-805 dark:text-zinc-300 font-semibold">Purpose:</strong> To verify your identity, prevent ghost accounts, and manage your active session securely.
                    </p>
                  </div>
                </div>

                {/* Level B */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold">B</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Resident Verification Data (Strictly Private)</h3>
                  </div>
                  <div className="pl-8 space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                    <p className="mb-2">
                      To unlock full write-access (posting, commenting, and marketplace interactions), users must submit proof of residency consisting of:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 mb-2">
                      <li><strong className="text-slate-805 dark:text-zinc-350 font-semibold">Structured Address Fields:</strong> Phase, Block, Street, and House/Plot Number.</li>
                      <li><strong className="text-slate-805 dark:text-zinc-350 font-semibold">Verification Document:</strong> A digital upload (PDF or image) of your latest official Bahria Electricity Bill or Maintenance Bill.</li>
                    </ul>
                    <p>
                      <strong className="text-slate-805 dark:text-zinc-300 font-semibold">Purpose:</strong> To cross-reference physical residency and protect the community from trolls, scammers, or outsiders.
                    </p>
                  </div>
                </div>

                {/* Level C */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 text-xs font-bold">C</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Public & Interactive Content (User-Generated)</h3>
                  </div>
                  <div className="pl-8 space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                    <ul className="list-disc pl-4 space-y-2">
                      <li>
                        <strong className="text-slate-805 dark:text-zinc-300 font-semibold">Social Feed & News:</strong> Posts, comments, and poll responses you actively publish.
                      </li>
                      <li>
                        <strong className="text-slate-805 dark:text-zinc-300 font-semibold">Marketplace Listings:</strong> Titles, descriptions, prices, item images, and the contact phone/WhatsApp link you choose to provide.
                      </li>
                      <li>
                        <strong className="text-slate-805 dark:text-zinc-300 font-semibold">Support Tickets & Complaints:</strong> Information submitted via anonymous complaint forms or the &quot;Contact Support&quot; module (including names, emails, and attached photo evidence).
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 2. How Your Data is Protected & Secured */}
            <section id="data-protection" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">2.</span> How Your Data is Protected & Secured
                </h2>
                <p className="text-sm text-slate-555 dark:text-zinc-400 font-light leading-relaxed">
                  We treat your personal and residency details with high-end, industry-standard cloud security infrastructure:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 space-y-3">
                  <div className="text-xl">🗄️</div>
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Secure Infrastructure</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                    Our data layer is powered by Supabase (PostgreSQL). All uploaded verification documents are stored in a private, encrypted storage bucket shielded by strict Row-Level Security (RLS).
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 space-y-3">
                  <div className="text-xl">🔒</div>
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Strict Access Control</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                    Uploaded utility/maintenance bills are completely hidden from the public. Only the uploading resident and authorized internal staff can view documents via temporary, expiring signed links.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 space-y-3">
                  <div className="text-xl">🧼</div>
                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Metadata Sanitization</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                    To protect your structural data privacy, all uploaded media files have their original metadata stripped and are automatically renamed to randomized UUID strings upon upload.
                  </p>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 3. The 30-Day Auto-Purge Policy */}
            <section id="auto-purge" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">3.</span> The 30-Day Auto-Purge Policy
                </h2>
                <p className="text-sm text-slate-555 dark:text-zinc-400 font-light leading-relaxed">
                  We do not believe in hoarding your private documents. This policy ensures your uploaded files do not live on our cloud indefinitely.
                </p>
              </div>

              <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 dark:border-emerald-500/10 overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-2xl flex-shrink-0">
                    ⏱️
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-slate-800 dark:text-zinc-100">
                      The Retention Rule & Automatic Purging
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed font-light">
                      Once an authorized Community Admin reviews your uploaded electricity or maintenance bill and marks your profile status as <strong>&quot;Approved&quot;</strong> or <strong>&quot;Rejected&quot;</strong>, a background process is triggered. The original uploaded document file is automatically and permanently purged from our secure cloud storage <strong>within 30 days</strong>.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                      Only your structured, verified address layout (Phase, Block, Street, Plot) remains linked to your profile to preserve platform integrity and prevent duplicate plot claims.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 4. Role-Based Data Isolation (Who Sees What?) */}
            <section id="role-isolation" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">4.</span> Role-Based Data Isolation
                </h2>
                <p className="text-sm text-slate-555 dark:text-zinc-400 font-light leading-relaxed">
                  Our platform enforces strict Role-Based Access Control (RBAC) to isolate sensitive resident files from unauthorized team roles:
                </p>
              </div>

              {/* Grid showing roles comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Moderator */}
                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">ROLE 1</span>
                    <span className="text-[10px] uppercase font-bold text-red-500 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      Feed Only
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Content Moderators</h3>
                  <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Personnel assigned to monitor the public social feed or approve buy/sell listings. They <strong>cannot</strong> access or view your private residential verification documents or sensitive support tickets.
                  </p>
                </div>

                {/* Community Admin */}
                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">ROLE 2</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Verifier
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Community Admins</h3>
                  <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Trusted high-level local administrators. They hold explicit permission and authorization keys to audit onboarding documents and approve residency verification requests.
                  </p>
                </div>

                {/* Superadmin */}
                <div className="p-6 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">ROLE 3</span>
                    <span className="text-[10px] uppercase font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      System Logs
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">Superadmins</h3>
                  <p className="text-xs font-light text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Technical platform administrators. They maintain system logs but do not participate in everyday document viewing unless resolving escalated, complex disputes.
                  </p>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 5. Spam and Bot Protection */}
            <section id="spam-protection" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">5.</span> Spam and Bot Protection
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                To maintain a clean and lightweight user experience, our public interaction portals (such as anonymous complaints or pre-signup footer support links) utilize security features like rate-limiting throttles and hidden honeypot fields. These mechanisms detect and silently discard automated script abuse, keeping our administration queues free of malicious spam.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 6. Third-Party Services */}
            <section id="third-party" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">6.</span> Third-Party Services
                </h2>
                <p className="text-sm text-slate-555 dark:text-zinc-400 font-light leading-relaxed">
                  We partner with specific trusted cloud services to run the platform efficiently. We do <strong>not</strong> sell, trade, or rent your personal resident data to third-party advertisers or corporate entities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 space-y-2">
                  <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase">Database & Storage</div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Supabase / AWS S3</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    For managed database hosting, PostgreSQL indexing, performance optimization, and content delivery (CDN).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 space-y-2">
                  <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase">System Emails</div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Resend / SendGrid</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    For executing transactional emails (sending support tracking numbers or secure verification links directly to your inbox).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 space-y-2">
                  <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase">Social Identity</div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Google & Facebook OAuth</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                    For providing seamless, single-click social login flows to register or sign in safely.
                  </p>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 7. Your Rights & Control */}
            <section id="user-rights" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">7.</span> Your Rights & Control
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-400 leading-relaxed font-light mb-4">
                As a resident using Orchard Connect, you maintain control over your digital footprint:
              </p>
              <ul className="list-disc pl-5 space-y-3 text-xs text-slate-600 dark:text-zinc-400">
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200 font-semibold">Correction:</strong> You can modify your active marketplace listings or re-submit updated documents if your verification is marked unsuccessful.
                </li>
                <li>
                  <strong className="text-slate-805 dark:text-zinc-200 font-semibold">Account Deletion:</strong> You can request the total removal of your profile and historical data from the network by contacting our portal support desk.
                </li>
              </ul>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 8. Updates to This Policy */}
            <section id="policy-updates" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">8.</span> Updates to This Policy
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                We may occasionally update this Privacy Policy to reflect technical stack adjustments or community guidelines. Any significant policy changes will be highlighted transparently via a notification banner at the top of your dashboard viewport.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* Contact Us */}
            <section id="contact-us" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                Contact Us
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
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
