"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, User } from "@/lib/api";
import EmailVerificationModal from "@/components/EmailVerificationModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");
  const [mounted, setMounted] = useState(false);
  
  const [documentUploading, setDocumentUploading] = useState(false);
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

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
      
      if (!validTypes.includes(file.type)) {
        showToast("Please upload a PDF, PNG, or JPEG file.", "error");
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showToast("File size must be less than 10MB.", "error");
        return;
      }

      setDocumentUploading(true);
      try {
        const formData = new FormData();
        formData.append("document", file);

        const res = await apiRequest("/api/resident/profile/document", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          showToast("Document uploaded successfully! Awaiting review.", "success");
          await fetchUser();
          window.dispatchEvent(new CustomEvent("refresh-user-session"));
        } else {
          const errData = await res.json();
          showToast(errData.message || "Failed to upload residency document.", "error");
        }
      } catch (err) {
        console.error("Document upload error:", err);
        showToast("Network error. Please try again.", "error");
      } finally {
        setDocumentUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const formatRejectionReason = (reason?: string) => {
    if (!reason) return "";
    return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isEmailUnverified = mounted && user && user.email_verified_at === null;

  const isResidencyVerified = user?.resident_profile?.is_verified === true || user?.resident_profile?.status === "approved";
  const showResidencyBanner = mounted && user && user.resident_profile && !isResidencyVerified;
  const profile = user?.resident_profile;
  const isRejected = profile?.status === "rejected";
  const hasDocument = profile?.document_path !== null && profile?.document_path !== undefined;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      
      {/* Floating Micro-Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-xs font-semibold max-w-sm animate-slide-in ${
          toast.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-250/30" 
            : toast.type === "error"
            ? "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border-rose-250/30"
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

      {/* Persistent Verification Banners */}
      {(isEmailUnverified || showResidencyBanner) && (
        <div className="w-full flex flex-col z-50 relative shrink-0">
          
          {/* Persistent Email Verification Banner */}
          {isEmailUnverified && (
            <div className="w-full bg-rose-500/10 border-b border-rose-500/20 text-rose-800 dark:text-rose-400 py-3.5 px-6 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
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

          {/* Persistent Residency Verification Banner */}
          {showResidencyBanner && (
            <div className={`w-full py-3.5 px-6 border-b text-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
              isRejected 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-sm">
                  {isRejected ? "⚠️" : "🔒"}
                </span>
                <p className="font-light">
                  {isRejected ? (
                    <>
                      <strong>Residency Profile Rejected</strong> (Reason: {formatRejectionReason(profile?.rejection_reason)}). 
                      {profile?.rejection_message && <span className="italic"> "{profile.rejection_message}"</span>}
                      {" "}Please upload your latest Electricity Bill or Maintenance Bill (PDF, PNG, JPG, or JPEG format). Note: This document will be permanently deleted once your residency status is approved or rejected.
                    </>
                  ) : !hasDocument ? (
                    <>
                      <strong>Read-Only Guest State</strong> — Please upload your latest official Bahria Electricity Bill or Maintenance Bill (PDF, PNG, JPG, or JPEG format) to verify your residency and unlock all features. Note: This document will be permanently deleted once your residency status is approved or rejected.
                    </>
                  ) : (
                    <>
                      <strong>Read-Only Guest State</strong> — Your proof documents are pending review. Interactions are restricted. Note: This document will be permanently deleted once your residency status is approved or rejected.
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isRejected && (
                  <button 
                    onClick={() => router.push("/auth/complete-profile")}
                    className="px-4 py-1.5 rounded-lg bg-amber-550 hover:bg-amber-600 dark:bg-amber-650 dark:hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Update Address
                  </button>
                )}

                {(!hasDocument || isRejected) && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleUploadDocument} 
                      accept=".pdf,.png,.jpg,.jpeg" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={documentUploading}
                      className={`px-4 py-1.5 rounded-lg text-white font-bold text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 ${
                        isRejected 
                          ? "bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600" 
                          : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
                      }`}
                    >
                      {documentUploading && (
                        <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {documentUploading ? "Uploading..." : isRejected ? "Upload New Proof" : "Upload Proof"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

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
