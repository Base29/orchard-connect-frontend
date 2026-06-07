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

/**
 * Initializes and retrieves the singleton Laravel Echo instance.
 * Automatically injects the active user Sanctum Bearer token for private channel authorization.
 */
export function getEcho(): any {
  if (typeof window === "undefined") return null;

  if (echoInstance) return echoInstance;

  const token = getAuthToken();
  if (!token) return null;

  window.Pusher = Pusher;

  // Dynamically resolve WebSocket connection parameters from the dynamic API URL
  const apiHttpUrl = getBaseUrl();

  let wsHost = window.location.hostname;
  let wsPort = 8080;
  let wssPort = 8080;
  let forceTLS = false;

  if (apiHttpUrl.startsWith("http://") || apiHttpUrl.startsWith("https://")) {
    try {
      const apiVal = new URL(apiHttpUrl);
      wsHost = apiVal.hostname;

      const apiPort = apiVal.port ? parseInt(apiVal.port) : (apiVal.protocol === "https:" ? 443 : 80);
      wsPort = apiPort;
      wssPort = apiPort;
      forceTLS = apiVal.protocol === "https:";
    } catch (e) {
      console.error("Failed to parse API URL for Echo configuration:", e);
    }
  }

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: "orchard_reverb_key", // Matches REVERB_APP_KEY in docker-compose/env
    wsHost: wsHost,
    wsPort: wsPort,
    wssPort: wssPort,
    forceTLS: forceTLS,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiHttpUrl}/api/broadcasting/auth`, // Secure Sanctum authorizer
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });

  window.Echo = echoInstance;
  return echoInstance;
}
