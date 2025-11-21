// app/api/[transport]/route.ts - MCP 2025-06-18 OAuth 2.1 Compliant with Arcjet Security

import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpHandler } from "mcp-handler";
import { type NextRequest, NextResponse } from "next/server";
import { verifyGoogleToken } from "@/lib/auth";
import { rollDice, rollDiceTool } from "@/lib/dice";
import { aj } from "@/lib/arcjet-config";
import { logger } from "@/lib/logger";

logger.info("Initializing MCP OAuth 2.1 Server with Arcjet Security", {
  specification: "MCP 2025-06-18",
  security: ["OAuth 2.1", "Arcjet Rate Limiting", "Bot Protection"],
});

// Type definitions for better type safety
interface ToolExtra {
  requestInfo?: {
    headers?: {
      authorization?: string;
    };
  };
}

// Store auth context for current request
let currentAuthInfo: AuthInfo | null = null;

// Create auth-aware tool wrapper
function createAuthenticatedTool(toolFunction: typeof rollDice) {
  return async (args: Record<string, unknown>, extra?: ToolExtra) => {
    // Extract auth info from the request headers if currentAuthInfo is not available
    let authInfo = currentAuthInfo;

    if (!authInfo && extra?.requestInfo?.headers?.authorization) {
      const authHeader = extra.requestInfo.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          // Create a mock request object for verifyGoogleToken
          const mockRequest = {
            headers: new Map([["authorization", authHeader]]),
            url: "http://localhost:3000/api/mcp",
            method: "POST",
          };
          authInfo =
            (await verifyGoogleToken(
              mockRequest as unknown as Request,
              token,
            )) || null;
        } catch (error) {
          console.log("Auth extraction failed:", error);
        }
      }
    }

    // Call the dice rolling function with the sides parameter
    const sides = args.sides as number;
    const result = toolFunction(sides);
    
    return {
      content: [result],
    };
  };
}

// Create the base MCP handler
const baseHandler = createMcpHandler(
  (server) => {
    logger.info("Registering MCP tools with OAuth 2.1 authentication");
    // Register tools with auth context injection
    server.tool(
      rollDiceTool.name,
      rollDiceTool.description,
      rollDiceTool.schema,
      createAuthenticatedTool(rollDice),
    );
  },
  {
    serverInfo: {
      name: "secure-rolldice",
      version: "1.0.0",
    },
    capabilities: {
      tools: {
        listChanged: false,
      },
      resources: {
        subscribe: false,
        listChanged: false,
      },
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  },
);

// MCP Authorization Specification compliant wrapper with Arcjet protection
async function mcpAuthHandler(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip") || 
                   "unknown";

  logger.mcp("Request received", {
    method: request.method,
    path: request.nextUrl.pathname,
    ip: clientIp,
  });

  // Step 1: Arcjet Security Check
  const decision = await aj.protect(request, { requested: 1 });
  
  logger.arcjet(
    decision.conclusion,
    clientIp,
    request.nextUrl.pathname,
    decision.reason.toString()
  );

  if (decision.isDenied()) {
    logger.security("Arcjet blocked request", {
      ip: clientIp,
      path: request.nextUrl.pathname,
      reason: decision.reason.toString(),
      ruleResults: decision.results,
    }, "warn");

    if (decision.reason.isRateLimit()) {
      const resetTime = decision.reason.resetTime ? new Date(decision.reason.resetTime).getTime() : Date.now() + 60000;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return new NextResponse(
        JSON.stringify({
          error: "rate_limit_exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        },
      );
    }

    if (decision.reason.isBot()) {
      return new NextResponse(
        JSON.stringify({
          error: "bot_detected",
          message: "Automated access is not allowed for this endpoint.",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: "forbidden",
        message: "Request blocked by security policy.",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  // Step 2: OAuth 2.1 Token Verification
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.security("Missing or invalid authorization header", {
      ip: clientIp,
      path: request.nextUrl.pathname,
      hasAuthHeader: !!authHeader,
    }, "warn");

    // RFC 9728: WWW-Authenticate header must point to protected resource metadata
    const protectedResourceUrl = `${request.nextUrl.origin}/.well-known/oauth-protected-resource`;

    const response = new NextResponse(
      JSON.stringify({
        error: "unauthorized",
        message: "Bearer token required",
        details:
          "This MCP server requires OAuth 2.1 authentication. Use the protected resource metadata to discover authorization servers.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          // RFC 9728 Section 5.1: WWW-Authenticate Response
          "WWW-Authenticate": `Bearer realm="MCP Server", resource="${protectedResourceUrl}"`,
        },
      },
    );

    logger.request(
      request.method,
      request.nextUrl.pathname,
      401,
      Date.now() - startTime,
      { reason: "missing_token", ip: clientIp }
    );

    return response;
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  logger.debug("Token verification starting", { 
    tokenLength: token.length,
    ip: clientIp,
  });

  try {
    // Verify the Google ID token with enhanced MCP 2025-06-18 validation
    const authInfo = await verifyGoogleToken(request, token);

    if (!authInfo) {
      logger.security("Token verification failed", {
        ip: clientIp,
        path: request.nextUrl.pathname,
      }, "warn");

      const response = new NextResponse(
        JSON.stringify({
          error: "invalid_token",
          message: "Token verification failed",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Bearer error="invalid_token"',
          },
        },
      );

      logger.request(
        request.method,
        request.nextUrl.pathname,
        401,
        Date.now() - startTime,
        { reason: "invalid_token", ip: clientIp }
      );

      return response;
    }

    logger.oauth("Token verified successfully", {
      clientId: authInfo.clientId || "unknown",
      scopes: authInfo.scopes || [],
      email: authInfo.extra?.email || "unknown",
      provider: authInfo.extra?.provider || "unknown",
      ip: clientIp,
    });

    // Store auth info for tools to access
    currentAuthInfo = authInfo;

    // Token is valid, proceed to MCP handler
    const response = await baseHandler(request);

    // Clear auth info after request
    currentAuthInfo = null;

    logger.request(
      request.method,
      request.nextUrl.pathname,
      response.status,
      Date.now() - startTime,
      { authenticated: true, ip: clientIp }
    );

    return response;
  } catch (error) {
    logger.error("Token verification error", error as Error, {
      ip: clientIp,
      path: request.nextUrl.pathname,
    });

    const response = new NextResponse(
      JSON.stringify({
        error: "server_error",
        message: "Token verification failed",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    logger.request(
      request.method,
      request.nextUrl.pathname,
      500,
      Date.now() - startTime,
      { reason: "server_error", ip: clientIp }
    );

    return response;
  }
}

logger.info("MCP OAuth 2.1 server initialized with security features", {
  features: [
    "OAuth 2.1 token verification",
    "Resource parameter validation",
    "Token audience validation",
    "WWW-Authenticate headers on 401 (RFC 9728)",
    "Protected resource metadata endpoint",
    "Authorization server metadata endpoint",
    "Arcjet rate limiting",
    "Arcjet bot protection",
    "Arcjet shield (suspicious pattern detection)",
    "Structured JSON logging",
  ],
});

export { mcpAuthHandler as GET, mcpAuthHandler as POST };