/**
 * Arcjet Security Configuration
 * 
 * Provides rate limiting and bot protection for the MCP server
 * Configuration is environment-specific for development vs production
 */

import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/next";

const isProduction = process.env.NODE_ENV === "production";

// Get Arcjet key from environment variable
// In development, an empty key is allowed (DRY_RUN mode)
const ARCJET_KEY = process.env.ARCJET_KEY || "";

if (!ARCJET_KEY && isProduction) {
  console.warn(
    "⚠️  ARCJET_KEY is not set. Security features will be in DRY_RUN mode. " +
    "Get your key from https://app.arcjet.com for production deployment."
  );
}

/**
 * Main Arcjet instance for MCP endpoints
 * 
 * Rate Limiting Strategy:
 * - Token bucket algorithm (refills over time)
 * - Development: 100 requests per minute per IP
 * - Production: 30 requests per minute per IP
 * 
 * Protection Features:
 * - Shield: Detects suspicious patterns
 * - Bot Detection: Blocks automated bots, allows good bots (search engines)
 */
export const aj = arcjet({
  key: ARCJET_KEY,
  characteristics: ["ip.src"], // Rate limit by IP address
  rules: [
    // Token bucket rate limiting (allows bursts)
    tokenBucket({
      mode: isProduction ? "LIVE" : "DRY_RUN", // DRY_RUN in dev doesn't block
      refillRate: isProduction ? 30 : 100, // tokens per interval
      interval: "1m", // 1 minute
      capacity: isProduction ? 50 : 200, // max tokens in bucket
    }),
    // Arcjet Shield: Detects suspicious behavior
    shield({
      mode: isProduction ? "LIVE" : "DRY_RUN",
    }),
    // Bot detection: Allow good bots, deny bad ones
    detectBot({
      mode: isProduction ? "LIVE" : "DRY_RUN",
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc.
        "CATEGORY:PREVIEW", // Link previews
        "CATEGORY:MONITOR", // Uptime monitors
      ],
    }),
  ],
});

/**
 * Arcjet instance for OAuth endpoints
 * 
 * More permissive than MCP endpoints to allow legitimate OAuth flows
 * Production: 60 requests per minute (OAuth redirects can be frequent)
 */
export const ajOAuth = arcjet({
  key: ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    tokenBucket({
      mode: isProduction ? "LIVE" : "DRY_RUN",
      refillRate: isProduction ? 60 : 100,
      interval: "1m",
      capacity: isProduction ? 100 : 200,
    }),
    shield({
      mode: isProduction ? "LIVE" : "DRY_RUN",
    }),
  ],
});

/**
 * Arcjet instance for discovery endpoints (.well-known)
 * 
 * Most permissive - these are public metadata endpoints
 * Production: 120 requests per minute
 */
export const ajDiscovery = arcjet({
  key: ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    tokenBucket({
      mode: isProduction ? "LIVE" : "DRY_RUN",
      refillRate: isProduction ? 120 : 200,
      interval: "1m",
      capacity: isProduction ? 150 : 300,
    }),
  ],
});

export default aj;
