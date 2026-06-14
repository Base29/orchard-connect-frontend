import React from "react";

interface RoleBadgeProps {
  roles?: string[];
  className?: string;
}

export default function RoleBadge({ roles, className = "" }: RoleBadgeProps) {
  if (!roles || roles.length === 0) return null;

  // Helper to normalize different role name formats (objects, strings, spaces, underscores, casing)
  const getNormalizedRoleKey = (r: any): string | null => {
    if (!r) return null;
    const name = (typeof r === "string" ? r : r.name || "").toLowerCase().trim();
    if (name === "superadmin" || name === "super-admin" || name === "super_admin" || name === "super admin") {
      return "superadmin";
    }
    if (name === "community-admin" || name === "community_admin" || name === "communityadmin" || name === "community admin" || name === "admin") {
      return "community-admin";
    }
    if (name === "content-moderator" || name === "content_moderator" || name === "contentmoderator" || name === "content moderator" || name === "moderator") {
      return "content-moderator";
    }
    if (name === "marketplace-moderator" || name === "marketplace_moderator" || name === "marketplacemoderator" || name === "marketplace moderator" || name === "market moderator" || name === "market-moderator") {
      return "marketplace-moderator";
    }
    return null;
  };

  // Find the primary staff role (highest priority first)
  let primaryRoleKey: string | null = null;
  for (const r of roles) {
    const key = getNormalizedRoleKey(r);
    if (key) {
      primaryRoleKey = key;
      break;
    }
  }

  if (!primaryRoleKey) return null;

  // Custom configurations for badges
  const configs: Record<string, {
    label: string;
    colors: string;
    icon: React.ReactNode;
  }> = {
    superadmin: {
      label: "Super Admin",
      colors: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      icon: (
        <svg className="w-2.5 h-2.5 mr-1 text-current fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
        </svg>
      )
    },
    "community-admin": {
      label: "Admin",
      colors: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
      icon: (
        <svg className="w-2.5 h-2.5 mr-1 text-current fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.09-.138-2.145-.395-3.155a.75.75 0 0 0-.722-.515 11.209 11.209 0 0 1-7.877-3.08Z" clipRule="evenodd" />
        </svg>
      )
    },
    "content-moderator": {
      label: "Mod",
      colors: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20",
      icon: (
        <svg className="w-2.5 h-2.5 mr-1 text-current fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.022 7.447 7.447 0 0 0 2.417.422c4.142 0 7.5-3.134 7.5-7s-3.358-7-7.5-7-7.5 3.134-7.5 7c0 1.942.84 3.7 2.203 4.975A6.722 6.722 0 0 0 4.804 21.644Z" clipRule="evenodd" />
        </svg>
      )
    },
    "marketplace-moderator": {
      label: "Market Mod",
      colors: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      icon: (
        <svg className="w-2.5 h-2.5 mr-1 text-current fill-current" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.262-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm7.5-.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  const config = configs[primaryRoleKey];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase border select-none transition-all duration-200 ${config.colors} ${className}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
