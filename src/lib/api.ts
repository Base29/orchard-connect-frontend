/**
 * Client-side API Request Helper
 * Exposes clean fetch operations communicating with the backend container,
 * automatically forwarding user Sanctum cookies and handling auth redirection.
 */

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(^|;)\s*auth_token\s*=\s*([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
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

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        // Session expired, clean cookie and route to login
        document.cookie = "auth_token=; path=/; max-age=0";
        window.location.href = "/auth/login?error=oauth_failed";
      }
    }

    return response;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
