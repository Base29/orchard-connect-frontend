"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type VerificationStatus = "pending" | "approved" | "rejected" | null;

interface UserProfile {
  name: string;
  email: string;
  resident_profile?: {
    phase: string;
    block: string;
    house_number: string;
    street_number?: string;
    user_type: string;
    status: VerificationStatus;
    rejection_reason?: string;
    rejection_message?: string;
  } | null;
}

const PHASE_BLOCKS: Record<string, string[]> = {
  "Phase 1": [
    "Central",
    "Central Awami Villas",
    "Central Kanal Villas",
    "Eastern",
    "Eastern Extension",
    "Northern",
    "Southern"
  ],
  "Phase 2": [
    "Block A",
    "Block B",
    "Block C",
    "Block D",
    "Block D Awami Villas",
    "Block E",
    "Block F",
    "Block G",
    "Block H",
    "Block J"
  ],
  "Phase 3": [],
  "Phase 4": [
    "Block G1",
    "Block G2",
    "Block G3",
    "Block G4",
    "Block G5",
    "Block G6",
    "Block G7",
    "Awami Homes"
  ]
};

export default function CompleteProfilePage() {
  const router = useRouter();

  // Load state and user session from backend
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [rejectionsCount, setRejectionsCount] = useState(0);
  const [previousProfile, setPreviousProfile] = useState<UserProfile["resident_profile"]>(null);

  // Form fields state
  const [phase, setPhase] = useState("Phase 1");
  const [block, setBlock] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [userType, setUserType] = useState("tenant");

  // Status management
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch current user status on page load
  useEffect(() => {
    async function loadUserStatus() {
      try {
        const response = await apiRequest("/api/user");
        if (response.ok) {
          const data = await response.json();
          setIsLocked(data.is_locked);
          setRejectionsCount(data.rejections_count || 0);

          if (data.user?.resident_profile) {
            const profile = data.user.resident_profile;
            setPreviousProfile(profile);
            
            const loadedPhase = profile.phase;
            const validPhases = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];
            const resolvedPhase = validPhases.includes(loadedPhase) ? loadedPhase : "Phase 1";
            setPhase(resolvedPhase);

            if (resolvedPhase === "Phase 3") {
              setBlock("N/A");
            } else {
              setBlock(profile.block || "");
            }
            setHouseNumber(profile.house_number || "");
            setStreetNumber(profile.street_number || "");
            setUserType(profile.user_type || "tenant");
            
            // If they are already approved, redirect to dashboard
            if (profile.status === "approved") {
              router.push("/dashboard");
            }
          }
        }
      } catch (err) {
        console.error("Error loading user context:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!block.trim() || !houseNumber.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("phase", phase);
      formData.append("block", block.trim());
      formData.append("house_number", houseNumber.trim());
      formData.append("street_number", streetNumber.trim());
      formData.append("user_type", userType);

      const response = await apiRequest("/api/resident/profile", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrorMsg(errorData.message || "Failed to submit verification details.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again later.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRejectionReason = (reason?: string) => {
    if (!reason) return "";
    return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-400">Checking verification status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-200">
      
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl p-8 space-y-6 shadow-sm">
        
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Complete Residency Profile</h1>
          <p className="text-sm font-light text-slate-500 dark:text-zinc-400">
            Submit your address details to complete your profile setup.
          </p>
        </div>

        {/* Lockout Screen */}
        {isLocked ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 text-center space-y-4 animate-fade-in">
            <div className="text-3xl">🚫</div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">Profile Submission Locked</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                You have reached <strong>3 consecutive rejections</strong> within a rolling 48-hour period.
                Your online form submission has been locked.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-950 rounded-xl border border-neutral-100 dark:border-zinc-900 text-xs font-medium text-slate-700 dark:text-neutral-300">
              Please visit the <strong>Bahria Orchard Society Administration Office</strong> with physical utility bills or tenancy documentation for physical account verification.
            </div>
          </div>
        ) : (
          <>
            {/* Previous Rejection Banner */}
            {previousProfile?.status === "rejected" && (
              <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 space-y-1 text-xs">
                <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  ⚠️ Request Rejected (Failed Attempt {rejectionsCount}/3)
                </div>
                <p className="text-slate-600 dark:text-zinc-400 font-light">
                  Reason: <strong>{formatRejectionReason(previousProfile.rejection_reason)}</strong>
                </p>
                {previousProfile.rejection_message && (
                  <p className="text-slate-500 dark:text-zinc-400 italic mt-1 font-light border-l-2 border-amber-500/30 pl-2">
                    &ldquo;{previousProfile.rejection_message}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/40 text-rose-850 dark:text-rose-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {success ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/40 text-emerald-800 dark:text-emerald-400 text-sm text-center font-medium space-y-1 animate-fade-in">
                <p>Residency Profile Submitted!</p>
                <p className="text-xs font-light text-emerald-600/80 dark:text-emerald-500/80">
                  Awaiting administrator verification. Redirecting to dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Phase & Block */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="phase" className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      Bahria Phase <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="phase"
                      value={phase}
                      onChange={(e) => {
                        const newPhase = e.target.value;
                        setPhase(newPhase);
                        const newPhaseBlocks = PHASE_BLOCKS[newPhase] || [];
                        if (newPhase === "Phase 3") {
                          setBlock("N/A");
                        } else if (newPhaseBlocks.length > 0 && !newPhaseBlocks.includes(block)) {
                          setBlock("");
                        } else if (block === "N/A") {
                          setBlock("");
                        }
                      }}
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="Phase 1">Phase 1</option>
                      <option value="Phase 2">Phase 2</option>
                      <option value="Phase 3">Phase 3</option>
                      <option value="Phase 4">Phase 4</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="block" className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      Block <span className="text-rose-500">*</span>
                    </label>
                    {(PHASE_BLOCKS[phase] || []).length > 0 ? (
                      <select
                        id="block"
                        required
                        value={block}
                        onChange={(e) => setBlock(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="" disabled>Select Block</option>
                        {(PHASE_BLOCKS[phase] || []).map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                        {block && !(PHASE_BLOCKS[phase] || []).includes(block) && (
                          <option value={block}>{block}</option>
                        )}
                      </select>
                    ) : (
                      <input
                        id="block"
                        type="text"
                        required
                        disabled={phase === "Phase 3"}
                        placeholder={phase === "Phase 3" ? "No Blocks in Phase 3" : "e.g. Block A"}
                        value={block}
                        onChange={(e) => setBlock(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-zinc-900 cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                {/* House/Plot & Street */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="house" className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      House/Plot No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="house"
                      type="text"
                      required
                      placeholder="e.g. 142"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="street" className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      Street Name/No. (Opt)
                    </label>
                    <input
                      id="street"
                      type="text"
                      placeholder="e.g. Street 4"
                      value={streetNumber}
                      onChange={(e) => setStreetNumber(e.target.value)}
                      className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Residency Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    Residency Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "owner", label: "Property Owner" },
                      { key: "tenant", label: "Resident Tenant" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setUserType(item.key)}
                        className={`py-2.5 px-4 text-xs font-medium rounded-xl border transition-all active:scale-[0.98] ${
                          userType === item.key
                            ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                            : "border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-850"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form submit */}
                <button
                  type="submit"
                  disabled={submitting || !block.trim() || !houseNumber.trim()}
                  className="w-full flex items-center justify-center gap-2 mt-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm active:scale-[0.99] transition-all disabled:opacity-40 disabled:active:scale-100 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Address Details...
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </button>

              </form>
            )}
          </>
        )}
      </div>

    </div>
  );
}
