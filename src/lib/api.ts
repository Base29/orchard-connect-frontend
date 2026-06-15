/**
 * Client-side API Request Helper
 * Exposes clean fetch operations communicating with the backend container,
 * automatically forwarding user Sanctum cookies and handling auth redirection.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: string;
  email_verified_at?: string | null;
  resident_profile?: {
    phase: string;
    block: string;
    house_number: string;
    street_number?: string;
    user_type: string;
    is_verified: boolean;
    status: "pending" | "approved" | "rejected";
    rejection_reason?: string;
    rejection_message?: string;
  } | null;
  roles?: string[];
}

export function checkEmailVerification(user: User | null): boolean {
  if (user && user.email_verified_at === null) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("show-email-verification-modal"));
    }
    return false;
  }
  return true;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
}

export function setAuthToken(token: string, remember: boolean = false): void {
  if (typeof window === "undefined") return;
  if (remember) {
    localStorage.setItem("auth_token", token);
    sessionStorage.removeItem("auth_token");
  } else {
    sessionStorage.setItem("auth_token", token);
    localStorage.removeItem("auth_token");
  }
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("auth_token");
  localStorage.removeItem("auth_token");
  // Also clear any lingering cookies from the previous implementation
  document.cookie = "auth_token=; path=/; max-age=0";
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  headers.set("Accept", "application/json");

  // Set X-Socket-ID header if Laravel Echo is active and has a socket ID
  if (typeof window !== "undefined" && window.Echo && typeof window.Echo.socketId === "function") {
    const socketId = window.Echo.socketId();
    if (socketId) {
      headers.set("X-Socket-ID", socketId);
    }
  }

  // Set default JSON Content-Type only if request body is not multipart FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const baseUrl = getBaseUrl();
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        // Session expired, clear token and route to login
        clearAuthToken();
        window.location.href = "/auth/login?error=oauth_failed";
      }
    }

    if (response.status === 503) {
      if (typeof window !== "undefined") {
        // Dispatch a custom event to notify MaintenanceProvider
        window.dispatchEvent(new CustomEvent("platform-maintenance"));
      }
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

/**
 * Determine the API base URL dynamically.
 * Swaps localhost with the window's hostname if accessed from an external client (like a mobile device on LAN),
 * while preserving the original port and protocol.
 */
export function getBaseUrl(): string {
  const defaultUrl = "http://localhost:8080";
  const envUrl = process.env.NEXT_PUBLIC_API_URL || defaultUrl;

  if (typeof window === "undefined") {
    return envUrl;
  }

  try {
    const url = new URL(envUrl);
    // If the configured API URL hostname is localhost, but the browser is visiting a different host,
    // swap the hostname to match the browser's hostname while preserving the port and protocol.
    if (url.hostname === "localhost" && window.location.hostname !== "localhost") {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, ""); // Remove trailing slash if any
  } catch {
    return envUrl;
  }
}
