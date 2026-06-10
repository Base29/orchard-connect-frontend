"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiRequest, getAuthToken } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import { MaintenancePage } from "./MaintenancePage";

interface MaintenanceContextType {
  isMaintenance: boolean;
  loading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenance: false,
  loading: true,
});

export const useMaintenance = () => useContext(MaintenanceContext);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const pathname = usePathname();

  const checkStatus = async () => {
    try {
      // Fetch current maintenance status (public route)
      const statusRes = await apiRequest("/api/maintenance-status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsMaintenance(!!statusData.is_enabled);
        if (statusData.reverb_key) {
          // Initialize/refresh Echo with the correct key from the backend environment dynamically
          getEcho(statusData.reverb_key);
        }
      }
    } catch (err) {
      console.error("Error checking maintenance status:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial status check and re-run on path changes (e.g. navigation, login/logout redirects)
  useEffect(() => {
    checkStatus();
    setAuthToken(getAuthToken());
  }, [pathname]);

  // Setup fallback event listener to catch 503 response triggers immediately (e.g. client clicks during active session)
  useEffect(() => {
    const handleMaintenanceEvent = () => {
      console.log("Fail-safe platform-maintenance event caught, transitioning immediately to maintenance screen.");
      setIsMaintenance(true);
    };

    window.addEventListener("platform-maintenance", handleMaintenanceEvent);
    return () => {
      window.removeEventListener("platform-maintenance", handleMaintenanceEvent);
    };
  }, []);

  // Setup WebSocket connection to listen to real-time events, re-binding if the auth token changes
  useEffect(() => {
    const echo = getEcho();
    if (echo) {
      const channel = echo.channel("maintenance");
      
      channel.listen(".MaintenanceModeChanged", (data: { is_enabled: boolean }) => {
        console.log("Real-time MaintenanceModeChanged broadcast received:", data);
        setIsMaintenance(data.is_enabled);
      });

      return () => {
        echo.leave("maintenance");
      };
    }
  }, [authToken]);

  // Display a clean, minimal loading spinner while initial state resolves
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Connecting to platform...</p>
      </div>
    );
  }

  // If maintenance mode is active, display the maintenance page to all users on the resident platform
  if (isMaintenance) {
    return <MaintenancePage />;
  }

  // Otherwise, render the normal application layout/pages
  return (
    <MaintenanceContext.Provider value={{ isMaintenance, loading }}>
      {children}
    </MaintenanceContext.Provider>
  );
}
