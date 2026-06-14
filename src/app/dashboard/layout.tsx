"use client";

import React, { useState, useEffect } from "react";
import { apiRequest, User } from "@/lib/api";
import EmailVerificationModal from "@/components/EmailVerificationModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");
  const [mounted, setMounted] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await apiRequest("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("DashboardLayout failed to fetch user:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUser();

    const handleShowModal = () => setIsModalOpen(true);
    window.addEventListener("show-email-verification-modal", handleShowModal);
    
    // Listen for custom event to re-fetch user when verification status changes
    const handleRefreshUser = () => fetchUser();
    window.addEventListener("refresh-user-session", handleRefreshUser);

    return () => {
      window.removeEventListener("show-email-verification-modal", handleShowModal);
      window.removeEventListener("refresh-user-session", handleRefreshUser);
    };
  }, []);

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendStatus("idle");

    try {
      const res = await apiRequest("/api/email/verification-notification", {
        method: "POST",
      });

      if (res.ok) {
        setResendStatus("sent");
        setTimeout(() => setResendStatus("idle"), 5000);
      } else {
        setResendStatus("error");
      }
    } catch (err) {
      setResendStatus("error");
    } finally {
      setResendLoading(false);
    }
  };

  const isEmailUnverified = mounted && user && user.email_verified_at === null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      
      {/* Persistent Email Verification Banner */}
      {isEmailUnverified && (
        <div className="w-full bg-rose-500/10 border-b border-rose-500/20 text-rose-800 dark:text-rose-400 py-3.5 px-6 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors z-50">
          <div className="flex items-center gap-2.5">
            <span className="text-sm">✉️</span>
            <p className="font-light">
              <strong>Your email is unverified.</strong> Please check your inbox for the verification link to unlock account features.
            </p>
          </div>
          
          <button
            onClick={handleResendEmail}
            disabled={resendLoading || resendStatus === "sent"}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 text-white font-bold text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer shrink-0 flex items-center gap-1"
          >
            {resendLoading && (
              <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
            )}
            {resendStatus === "sent" ? "Link Resent" : resendStatus === "error" ? "Retry" : "Resend Link"}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Shared Verification Interceptor Modal */}
      {mounted && (
        <EmailVerificationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
