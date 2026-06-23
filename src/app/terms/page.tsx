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

export default function TermsOfServicePage() {
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
      "eligibility",
      "verification",
      "conduct",
      "marketplace",
      "isolation",
      "termination",
      "liability",
      "amendments",
      "support"
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
    { id: "eligibility", label: "1. Purpose & Eligibility" },
    { id: "verification", label: "2. Registration & Verification" },
    { id: "conduct", label: "3. Acceptable Use & Conduct" },
    { id: "marketplace", label: "4. Marketplace Guidelines" },
    { id: "isolation", label: "5. Role-Based Data Isolation" },
    { id: "termination", label: "6. Termination & Deletion" },
    { id: "liability", label: "7. Disclaimers & Liability" },
    { id: "amendments", label: "8. Amendments to Terms" },
    { id: "support", label: "9. Contact Support" }
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
              Terms Center
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
            ⚖️ Legal Framework
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-sm md:text-base text-slate-505 dark:text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
            Please read these Terms carefully. By accessing or using Orchard Connect (orchardconnect.pk), you agree to be bound by these Terms of Service.
          </p>
          <div className="mt-6 text-xs text-slate-400 dark:text-zinc-555 font-mono">
            UPDATED DATE: JUNE 22, 2026 | PLATFORM DOMAIN: ORCHARDCONNECT.PK
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
                Welcome to <strong className="font-semibold text-slate-900 dark:text-white">Orchard Connect</strong> (<span className="text-emerald-600 dark:text-emerald-400 hover:underline">orchardconnect.pk</span>). By accessing or using our decoupled real-time community social media platform (including our Next.js frontend, Laravel headless API backend, and Supabase data structures), you agree to be bound by these Terms of Service (&quot;Terms&quot;). Please read them carefully. If you do not agree to these Terms, you must immediately cease using the platform.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 1. Platform Purpose & Eligibility */}
            <section id="eligibility" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">1.</span> Platform Purpose & Eligibility
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                Orchard Connect is a private, specialized digital neighborhood network designed exclusively for the residents, property owners, and verified tenants of Bahria Orchard. To access interactive features, you must satisfy the following criteria:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 dark:text-zinc-400">
                <li>
                  You must be an actual resident, property owner, or lawful tenant within Bahria Orchard.
                </li>
                <li>
                  You must accurately complete the progressive onboarding and resident verification protocols detailed below.
                </li>
                <li>
                  Accounts created by automated bots, scripts, or outsiders residing outside the geographical boundaries of Bahria Orchard are strictly prohibited and will be silently discarded via our infrastructure guardrails.
                </li>
              </ul>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 2. User Registration & Verification Protocols */}
            <section id="verification" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                  <span className="text-emerald-500">2.</span> User Registration & Verification Protocols
                </h2>
                <p className="text-sm text-slate-555 dark:text-zinc-400 font-light leading-relaxed">
                  To preserve platform integrity, eliminate ghost accounts, and shield neighbors from online trolls or scammers, Orchard Connect enforces a distinct multi-tiered access structure:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                
                {/* Social Sign-In */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold">1</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Social Sign-In (Initial Access)</h3>
                  </div>
                  <div className="pl-8 space-y-1 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                    <p>
                      Initial authentication is established via Google or Facebook OAuth, utilizing Laravel Sanctum to manage secure, active tokens. Upon login, users enter a hard, <strong>&quot;Read-Only Guest State&quot;</strong> allowing them to view community news feeds and marketplace archives.
                    </p>
                  </div>
                </div>

                {/* Resident Verification */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold">2</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Resident Verification Requirement</h3>
                  </div>
                  <div className="pl-8 space-y-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                    <p>
                      To unlock write-access (posting to the social feed, leaving comments, participating in community polls, or publishing marketplace listings), users are required to supply structured address metadata (Phase, Block, Street, House/Plot Number) and upload a digital proof of residency (such as a copy of their latest official Bahria Electricity Bill or Maintenance Bill).
                    </p>
                  </div>
                </div>

                {/* Mandatory Redaction Rule */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold">3</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Mandatory Redaction Rule</h3>
                  </div>
                  <div className="pl-8 space-y-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                    <p>
                      To protect your personal data, uploaded documents <strong>must be heavily redacted before submission</strong>. Only the physical street/property address must remain completely legible. You must explicitly blur, cross out, or black out all other non-essential data segments, including but not limited to:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Consumer / reference numbers</li>
                      <li>Meter numbers</li>
                      <li>QR codes and barcodes</li>
                      <li>Payment status indicators</li>
                      <li>Bill balances or payment amounts</li>
                      <li>Any visible National Identity Card (CNIC) details or associated individual identifiers</li>
                    </ul>
                  </div>
                </div>

                {/* Manual Audit */}
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 text-xs font-bold">4</span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Manual Audit & Status Transitions</h3>
                  </div>
                  <div className="pl-8 space-y-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                    <p>
                      Verification requests are manually reviewed by authorized staff via our internal Filament dashboard. If a submission is approved, full network privileges are instantly unlocked. If a submission is rejected (e.g., due to unreadable text, unredacted sensitive criteria, or an address mismatch), the account remains in a read-only state, and the user is permitted to re-submit corrected credentials.
                    </p>
                  </div>
                </div>

                {/* Instant-Purge Policy Callout Box */}
                <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 dark:border-emerald-500/10 overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-2xl flex-shrink-0">
                      🔒
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">
                        Data Security & The Immediate Auto-Purge Policy
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed font-light">
                        Orchard Connect holds a zero-retention mandate regarding physical documentation. In accordance with our aggressive, privacy-first data minimization standards, the moment an authorized Administrator processes an onboarding verification request and clicks <strong>&quot;Approved&quot;</strong> or <strong>&quot;Rejected&quot;</strong> within the Filament dashboard, a background workflow is instantly triggered.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-light">
                        The uploaded bill image or file is immediately, permanently, and irreversibly purged from our private, encrypted cloud storage buckets. No historical document footprint is preserved; only the validated address mapping is linked to your database profile record to secure access privileges and maintain platform integrity.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 3. Acceptable Use & Code of Conduct */}
            <section id="conduct" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">3.</span> Acceptable Use & Code of Conduct
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                Orchard Connect is an organic neighborhood watch and hyper-local collaborative social network. All interactive users agree to express absolute civil decorum. You explicitly covenant that you will not publish, comment, or transmit any user-generated content that:
              </p>
              <ul className="list-disc pl-5 space-y-3 text-xs text-slate-600 dark:text-zinc-400">
                <li>
                  Contains malicious spam, script abuse, or automated payload injections. Open forms are protected by hidden honeypot inputs and strict IP-based rate-limiting throttles; any automated violation results in immediate database isolation.
                </li>
                <li>
                  Promotes targeted harassment, personal feuds, local defamation, or malicious real estate scams.
                </li>
                <li>
                  Discusses political or structural topics entirely unrelated to the hyper-local Bahria Orchard community.
                </li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-light leading-relaxed pt-2">
                Staff Content Moderators maintain permission parameters to flag, drop, or permanently archive public social posts or comments that violate these baselines. All administrative interventions are compiled into a tamper-proof audit trail for Superadmin review.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 4. Localized Marketplace Guidelines */}
            <section id="marketplace" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">4.</span> Localized Marketplace Guidelines
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                The marketplace module allows verified residents to publish classified advertisements. Orchard Connect operates strictly as a decoupled information bridge:
              </p>
              <ul className="list-disc pl-5 space-y-3 text-xs text-slate-600 dark:text-zinc-400">
                <li>
                  <strong className="text-slate-800 dark:text-zinc-200 font-semibold">No Intermediary Transactions:</strong> The platform does not process payments, manage local escrow, or settle buy/sell negotiations. Communication is shifted externally via a direct, external &quot;Chat via WhatsApp&quot; bridge.
                </li>
                <li>
                  <strong className="text-slate-805 dark:text-zinc-200 font-semibold">Moderation Staging Queue:</strong> All newly generated marketplace listings land automatically in a hidden staging repository. Listings will not be published onto the public Next.js frontend feed until an authorized Marketplace Moderator audits the title, item images, and description for safety compliance.
                </li>
                <li>
                  <strong className="text-slate-805 dark:text-zinc-200 font-semibold">Automated Expiry:</strong> To prevent server clutter and maintain a lightweight user experience, active classified listings are automatically archived and removed from public view after a set retention period (typically 30 days).
                </li>
              </ul>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 5. Role-Based Data Isolation & Privacy Safeguards */}
            <section id="isolation" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">5.</span> Role-Based Data Isolation & Privacy Safeguards
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-350 leading-relaxed font-light">
                We treat your personal and structural resident profiles with strict, high-end enterprise separation protocols under a customized Role-Based Access Control (RBAC) model.
              </p>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-light">
                Residential validation documents are stored in encrypted environments protected by Row-Level Security (RLS) and are completely hidden from the public. Content Moderators who police public social feeds are strictly barred from viewing private utility files or sensitive support tickets. Access to onboarding documents during their transient validation lifetime is restricted solely to authorized Community Admins via expiring, temporary signed URLs.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 6. Termination & Deletion Rights */}
            <section id="termination" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">6.</span> Termination & Deletion Rights
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                Residents retain absolute command over their digital footprint. You possess the right to be forgotten. Account deletion requests can be initiated at any time through the <Link href="/support" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Contact Support</Link> helpdesk link located in the landing page viewport footer or by notifying the administration desk. Upon request execution, technical Superadmins will permanently purge your authentication mapping, core profile records, and associated interactive feed history from our active PostgreSQL database clusters within 24 to 48 hours.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 7. Disclaimers & Limitation of Liability */}
            <section id="liability" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">7.</span> Disclaimers & Limitation of Liability
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                Orchard Connect is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis without representations or warranties of any kind. The platform is an independent, community-driven initiative and holds no official corporate or legal affiliation with the primary developer of Bahria Orchard. We do not guarantee the absolute accuracy of user-generated marketplace entries, anonymous support ticket resolution times, or uninterrupted WebSocket broadcast states via Laravel Reverb. In no event shall the platform administration, team members, or Superadmins be held liable for any damages arising out of your utilization of our digital network channels.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 8. Amendments to Terms */}
            <section id="amendments" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">8.</span> Amendments to Terms
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                We reserve the right to adapt or modify these Terms of Service to correspond with backend technical optimizations, cloud infrastructure changes, or expanded local civic features. Any major structural revisions will be transparently broadcasted via a persistent notification banner displayed across the user dashboard viewport layout.
              </p>
            </section>

            <hr className="border-slate-200/60 dark:border-zinc-900" />

            {/* 9. Contact Support */}
            <section id="support" className="space-y-4 scroll-mt-24">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-emerald-500">9.</span> Contact Support
              </h2>
              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-light">
                For questions or formal compliance declarations regarding these Terms, please utilize the automated <Link href="/support" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Contact Support</Link> form located in our footer layout. Submitting a ticket automatically generates a unique tracking reference key allowing you to audit administrative resolution responses directly.
              </p>

              <div className="pt-6 border-t border-slate-100 dark:border-zinc-900 mt-6">
                <p className="text-sm italic font-medium text-emerald-700 dark:text-emerald-400">
                  Building a secure, vibrant neighborly ecosystem.
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 font-mono">
                  — The Orchard Connect Team
                </p>
              </div>
            </section>

          </main>

        </div>
      </div>

      {/* Footer */}
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
