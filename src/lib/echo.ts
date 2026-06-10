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
let cachedKey: string | null = null;

/**
 * Initializes and retrieves the singleton Laravel Echo instance.
 * Automatically injects the active user Sanctum Bearer token for private channel authorization.
 * Supports dynamically passing the Reverb app key fetched from the backend.
 */
export function getEcho(dynamicKey?: string): any {
  if (typeof window === "undefined") return null;

  const token = getAuthToken() || null;
  const currentKey = dynamicKey || cachedKey || "orchard_reverb_key";

  if (echoInstance && cachedToken === token && cachedKey === currentKey) {
    return echoInstance;
  }

  // Disconnect existing instance if the token or key changed
  if (echoInstance) {
    try {
      echoInstance.disconnect();
      console.log("[Reverb] Disconnected old Echo instance due to token/key change.");
    } catch (e) {
      console.error("[Reverb] Failed to disconnect old Echo instance:", e);
    }
    echoInstance = null;
  }

  cachedToken = token;
  cachedKey = currentKey;
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
      console.error("[Reverb] Failed to parse API URL for Echo configuration:", e);
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

  console.log(`[Reverb] Initializing Echo: host=${wsHost}, port=${wsPort}, secure=${forceTLS}, key=${currentKey}`);

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: currentKey,
    wsHost: wsHost,
    wsPort: wsPort,
    wssPort: wssPort,
    forceTLS: forceTLS,
    enabledTransports: ["ws", "wss"],
    ...authConfig,
  });

  // Attach connection lifecycle loggers for debugging production/demo issues
  if (echoInstance.connector && echoInstance.connector.pusher) {
    const conn = echoInstance.connector.pusher.connection;
    conn.bind("state_change", (states: any) => {
      console.log(`[Reverb] Connection state changed: ${states.previous} -> ${states.current}`);
    });
    conn.bind("error", (err: any) => {
      console.error("[Reverb] Connection error:", err);
    });
    conn.bind("connected", () => {
      console.log("[Reverb] Socket successfully connected and online!");
    });
  }

  window.Echo = echoInstance;
  return echoInstance;
}
