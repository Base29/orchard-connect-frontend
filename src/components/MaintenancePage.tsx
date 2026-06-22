import React from "react";
import Link from "next/link";

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200 justify-between relative overflow-hidden select-none">
      
      {/* Background radial glows for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 dark:bg-teal-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Orchard Connect
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100/50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-250/20">
            Bahria Orchard
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-10 max-w-xl mx-auto text-center space-y-8">
        
        {/* Pulsing Maintenance Icon */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-2">
          <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-full animate-ping opacity-60" />
          <div className="absolute inset-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            {/* Custom SVG icon for maintenance/construction */}
            <svg className="w-9 h-9 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-4">
          <span className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
            Scheduled Community Upgrades
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Undergoing Essential <br />
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Maintenance
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-light leading-relaxed max-w-md mx-auto">
            We are currently executing scheduled system improvements to optimize our gated resident network, marketplace transactions, and feed updates.
          </p>
        </div>

        {/* Premium Information Card */}
        <div className="w-full p-6 rounded-2xl bg-white/40 dark:bg-zinc-900/30 border border-neutral-200/50 dark:border-zinc-800/80 backdrop-blur-md space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-xs border-b border-neutral-200/30 dark:border-zinc-800/50 pb-3">
            <span className="text-slate-400">Current Status</span>
            <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Upgrading Assets
            </span>
          </div>
          
          <div className="text-xs text-left text-slate-500 dark:text-zinc-400 font-light space-y-2 leading-relaxed">
            <p>
              During this brief downtime, posting new discussions, browsing directory listings, and marketplace features are temporarily paused.
            </p>
            <p>
              We expect to restore full community services shortly. No resident data or verification progress is affected by this maintenance.
            </p>
          </div>
        </div>

        {/* Support Link */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-light">
            Need urgent assistance or have queries?
          </p>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 transition-all duration-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Contact Support Helpdesk
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-neutral-100 dark:border-zinc-900 bg-white/30 dark:bg-black/30 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-[10px] text-slate-400 dark:text-zinc-500 font-light">
          © {new Date().getFullYear()} Orchard Connect. All rights reserved. Designed exclusively for Bahria Orchard residents.
        </div>
      </footer>

      {/* Custom slow animation style injector */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}} />

    </div>
  );
}
