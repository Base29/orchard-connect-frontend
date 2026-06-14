import React from "react";

interface ResidentProfile {
  phase: string;
  block: string;
  is_verified?: boolean;
  status?: string;
}

interface ResidentBadgesProps {
  profile?: ResidentProfile | null;
  className?: string;
  size?: "sm" | "md";
}

export default function ResidentBadges({ profile, className = "", size = "md" }: ResidentBadgesProps) {
  if (!profile) return null;

  const isSmall = size === "sm";

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-extrabold tracking-wider uppercase border border-emerald-500/20 select-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ${isSmall ? "text-[8px] px-1.5 py-0" : "text-[9px]"}`}>
        Verified Resident
      </span>
    </div>
  );
}
