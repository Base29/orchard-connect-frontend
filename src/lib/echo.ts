import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getAuthToken } from "./api";

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

  const wsHost = window.location.hostname;
  const caddyPort = 8080; // Entry port of the unified Caddy proxy

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: "orchard_reverb_key", // Matches REVERB_APP_KEY in docker-compose/env
    wsHost: wsHost,
    wsPort: caddyPort,
    wssPort: caddyPort,
    forceTLS: false, // True in prod, false in local dev monorepo
    enabledTransports: ["ws", "wss"],
    authEndpoint: "http://localhost:8080/api/broadcasting/auth", // Secure Sanctum authorizer
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
