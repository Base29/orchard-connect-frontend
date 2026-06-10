import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getAuthToken, getBaseUrl } from "./api";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: any;
  }
}

let echoInstance: any = null;
let cachedToken: string | null = null;

/**
 * Initializes and retrieves the singleton Laravel Echo instance.
 * Automatically injects the active user Sanctum Bearer token for private channel authorization.
 */
export function getEcho(): any {
  if (typeof window === "undefined") return null;

  const token = getAuthToken() || null;

  if (echoInstance && cachedToken === token) {
    return echoInstance;
  }

  // Disconnect existing instance if the token changed
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch (e) {
      console.error("Failed to disconnect old Echo instance:", e);
    }
    echoInstance = null;
  }

  cachedToken = token;
  window.Pusher = Pusher;

  // Dynamically resolve WebSocket connection parameters
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  let wsHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
  let wsPort = isHttps ? 443 : 80;
  let wssPort = 443;
  let forceTLS = isHttps;

  if (typeof window !== "undefined") {
    const apiHttpUrl = getBaseUrl();
    try {
      const apiVal = new URL(apiHttpUrl);
      
      // If we are accessing via the Next.js dev server port (e.g., 3000), we need to direct
      // the websocket traffic to the backend API port (usually 8080) since Next.js doesn't proxy ws/wss.
      const isNextDev = window.location.port && window.location.port !== "8080" && window.location.port !== "80" && window.location.port !== "443";
      
      if (isNextDev) {
        wsHost = apiVal.hostname;
        forceTLS = apiVal.protocol === "https:";
        const apiPort = apiVal.port ? parseInt(apiVal.port) : (apiVal.protocol === "https:" ? 443 : 80);
        wsPort = apiPort;
        wssPort = apiPort;
      } else {
        // In unified environments (production, demo, or local dev accessed via Caddy directly),
        // we connect to the WebSocket on the exact same host, protocol, and port as the browser page.
        // This avoids mixed-content blocks and respects external proxy routing (like Cloudflare, Nginx, ALB).
        wsHost = window.location.hostname;
        forceTLS = isHttps;
        if (window.location.port) {
          const port = parseInt(window.location.port);
          wsPort = port;
          wssPort = port;
        } else {
          wsPort = isHttps ? 443 : 80;
          wssPort = 443;
        }
      }
    } catch (e) {
      console.error("Failed to parse API URL for Echo configuration:", e);
      // Fallback to match current window location
      wsHost = window.location.hostname;
      forceTLS = isHttps;
      if (window.location.port) {
        const port = parseInt(window.location.port);
        wsPort = port;
        wssPort = port;
      } else {
        wsPort = isHttps ? 443 : 80;
        wssPort = 443;
      }
    }
  }

  const authConfig = token ? {
    authEndpoint: `${getBaseUrl()}/api/broadcasting/auth`, // Secure Sanctum authorizer
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  } : {};

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: "orchard_reverb_key", // Matches REVERB_APP_KEY in docker-compose/env
    wsHost: wsHost,
    wsPort: wsPort,
    wssPort: wssPort,
    forceTLS: forceTLS,
    enabledTransports: ["ws", "wss"],
    ...authConfig,
  });

  window.Echo = echoInstance;
  return echoInstance;
}
