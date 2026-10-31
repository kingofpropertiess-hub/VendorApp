/**
 * Vendor App environment configuration.
 *
 * Same backend as the platform — single source of truth.
 * Resolution order:
 *   1. Runtime override (index.js can set global.__API_BASE_URL__ — e.g. via
 *      an env flag injected at build time).
 *   2. Production hosted backend (used by debug AND release builds).
 *   3. Local development defaults (Android emulator / device) — only when no
 *      production URL is configured.
 *
 * NOTE: localhost is never used in release builds.
 */

declare const global: { __API_BASE_URL__?: string } & typeof globalThis;

const PRODUCTION_API_BASE_URL = "https://kingofproperties-backend-five.vercel.app/api";

function resolve(): string {
  const runtime = typeof global !== "undefined" ? global.__API_BASE_URL__ : undefined;
  if (runtime) return stripTrailingSlash(runtime);

  // Live backend first (debug + release), same as the platform app.
  if (PRODUCTION_API_BASE_URL.trim().length > 0) {
    return PRODUCTION_API_BASE_URL.trim().replace(/\/$/, "");
  }

  if (__DEV__) {
    // Android emulator reaches host machine via 10.0.2.2.
    return "http://10.0.2.2:5001/api";
  }
  console.warn(
    "[config] No production API URL configured. Set PRODUCTION_API_BASE_URL in src/lib/config.ts."
  );
  return "http://10.0.2.2:5001/api";
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const API_BASE_URL = resolve();

/** Turn relative /uploads paths into absolute URLs on the backend origin. */
export function resolveImageUrl(url?: string | null, fallbackImage?: string): string | undefined {
  if (fallbackImage && (!url || url.trim() === "")) return fallbackImage;
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed === "") return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("/uploads/")) {
    const origin = API_BASE_URL.replace(/\/api$/, "");
    return `${origin}${trimmed}`;
  }
  return trimmed;
}

export const REQUEST_TIMEOUT_MS = 90_000;
/** Vendor auth calls hit a Vercel cold start often — allow more time. */
export const AUTH_TIMEOUT_MS = 75_000;
