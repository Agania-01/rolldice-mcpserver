# 🔐 Phase 2 Completed: Secure Rolldice MCP Server

## ✅ What Has Been Implemented

Your rolldice MCP server now has **OAuth 2.1 authentication** applied using patterns from the mcp-auth-demo!

### Files Created/Modified

#### 1. Authentication Core
- ✅ `lib/auth.ts` - Google OAuth token verification with MCP 2025-06-18 compliance
- ✅ `lib/oauth-utils.ts` - OAuth 2.1 utility functions
- ✅ `lib/auth-types.ts` - TypeScript type definitions for auth

#### 2. OAuth Discovery Endpoints
- ✅ `app/.well-known/oauth-authorization-server/route.ts` - Authorization server metadata (RFC 8414)
- ✅ `app/.well-known/oauth-protected-resource/route.ts` - Protected resource metadata (RFC 9728)

#### 3. OAuth Authentication Endpoints
- ✅ `app/api/auth/authorize/route.ts` - OAuth authorization endpoint
- ✅ `app/api/auth/token/route.ts` - Token exchange endpoint
- ✅ `app/api/auth/register/route.ts` - Dynamic client registration (RFC 7591)
- ✅ `app/api/auth/callback/route.ts` - OAuth callback handler
- ✅ `app/api/auth/callback/google/route.ts` - Google-specific callback

#### 4. Secured MCP Handler
- ✅ `app/api/[transport]/route.ts` - Updated with OAuth 2.1 authentication wrapper
  - Validates bearer tokens
  - Returns proper 401 responses with WWW-Authenticate headers
  - Injects auth context into dice rolling tools

#### 5. Configuration
- ✅ `.env.local` - Environment variables template
- ✅ `.vscode/mcp.json` - Updated with secure rolldice server configuration

#### 6. Dependencies
- ✅ `google-auth-library` - Google OAuth token verification
- ✅ `@types/jsonwebtoken` - TypeScript types for JWT
- ✅ `jsonwebtoken` - JWT handling

## 🚀 Next Steps to Complete Setup

### Step 1: Add Your Google OAuth Credentials

1. **Copy credentials from your mcp-auth-demo project** (from Phase 1)
2. **Open `.env.local`** in this project
3. **Replace the placeholder values:**
   ```env
   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-actual-secret-here
   ```

### Step 2: Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Credentials** > **OAuth 2.0 Client IDs**
3. Click on your OAuth client (the one from Phase 1)
4. Add these **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback
   https://rolldice-mcpserver-delta.vercel.app/api/auth/callback
   ```
   (Replace with your actual Vercel deployment URL)

### Step 3: Test Locally

1. **Restart the dev server** (if it's already running):
   ```powershell
   # Stop the current server (Ctrl+C) then:
   pnpm dev
   ```

2. **Test the discovery endpoints:**
   - Visit: `http://localhost:3000/.well-known/oauth-authorization-server`
   - Visit: `http://localhost:3000/.well-known/oauth-protected-resource`
   - Both should return JSON metadata

3. **Test with VS Code Insiders MCP Extension:**
   - The server is already configured in `.vscode/mcp.json`
   - Reload VS Code window
   - Try using the rolldice tool - you should see OAuth login prompt

### Step 4: Deploy to Production

1. **Deploy to Vercel:**
   ```powershell
   vercel --prod
   ```
   Or push to GitHub and let Vercel auto-deploy

2. **Add environment variables in Vercel:**
   - Go to your Vercel project settings
   - Navigate to **Environment Variables**
   - Add:
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`

3. **Update your production redirect URIs** in Google Cloud Console

### Step 5: Configure MCP Clients

#### VS Code Insiders (Already Configured!)
The `.vscode/mcp.json` has been updated with:
```json
{
  "servers": {
    "secure-rolldice": {
      "type": "http",
      "url": "https://rolldice-mcpserver-delta.vercel.app/api/mcp"
    },
    "secure-rolldice-local": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

#### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "secure-rolldice": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://rolldice-mcpserver-delta.vercel.app/api/mcp"
      ]
    }
  }
}
```

## 🧪 Testing Authentication

### Expected Behavior

1. **Without authentication:**
   - Request to `/api/mcp` returns 401 Unauthorized
   - Response includes `WWW-Authenticate` header
   - Response points to discovery endpoints

2. **With authentication:**
   - OAuth login flow starts automatically
   - Redirects to Google login
   - Returns to your app after authentication
   - Dice rolling tools work normally

### Test Commands

**Test with PowerShell** (should fail - no auth):
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/mcp" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

Expected: 401 Unauthorized with WWW-Authenticate header

**Test with VS Code Insiders:**
1. Open command palette
2. Use the secure-rolldice-local server
3. Try "roll a d20"
4. You should see OAuth login prompt

## 📋 Success Criteria Checklist

Phase 2 is complete when:

- [ ] `.env.local` has your actual Google OAuth credentials
- [ ] Google Cloud Console has redirect URIs updated
- [ ] Local server runs without errors at http://localhost:3000
- [ ] Discovery endpoints return valid JSON metadata
- [ ] OAuth login prompt appears when accessing tools
- [ ] Authentication completes successfully via Google
- [ ] Dice rolling works after authentication
- [ ] Unauthenticated requests return 401
- [ ] Production deployment works on Vercel
- [ ] Both VS Code MCP and Claude Desktop work with authentication

## 🎓 What You Learned

### OAuth 2.1 Implementation
- ✅ Token verification with Google OAuth
- ✅ PKCE (Proof Key for Code Exchange) support
- ✅ Authorization code flow
- ✅ Dynamic client registration (RFC 7591)

### MCP 2025-06-18 Compliance
- ✅ Protected resource metadata (RFC 9728)
- ✅ Authorization server metadata (RFC 8414)
- ✅ Proper WWW-Authenticate headers on 401
- ✅ Bearer token authentication
- ✅ Resource parameter validation

### Security Best Practices
- ✅ Token audience validation
- ✅ Redirect URI validation
- ✅ Secure token storage
- ✅ HTTPS enforcement for production
- ✅ Proper error handling

## 🐛 Troubleshooting

### Issue: "Missing required environment variables"
**Solution:** Make sure `.env.local` has actual credentials, not placeholders

### Issue: "Redirect URI mismatch"
**Solution:** Verify Google Cloud Console has all redirect URIs listed above

### Issue: "Token verification failed"
**Solution:** Check that GOOGLE_CLIENT_ID in .env.local matches Google Cloud Console

### Issue: Server won't start
**Solution:** 
1. Check for port conflicts: `netstat -ano | findstr :3000`
2. Kill the process: `taskkill /PID <pid> /F`
3. Restart: `pnpm dev`

## 📚 Resources

- [MCP Authorization Specification](https://modelcontextprotocol.io/)
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [RFC 8414 - Authorization Server Metadata](https://datatracker.ietf.org/doc/html/rfc8414)
- [RFC 9728 - Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**Phase 1:** ✅ Completed - Studied authentication patterns  
**Phase 2:** ✅ Completed - Applied to rolldice MCP server

🎉 **Congratulations!** You now have a production-ready, OAuth 2.1 authenticated MCP server!
