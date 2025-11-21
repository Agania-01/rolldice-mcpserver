# 🔐 Google Cloud Console Setup - Exact URLs

## Your Rolldice MCP Server URLs

Based on your configuration, your Vercel deployment is:
- **Production URL:** `https://rolldice-mcpserver-delta.vercel.app`
- **MCP Endpoint:** `https://rolldice-mcpserver-delta.vercel.app/api/mcp`

---

## 📋 STEP-BY-STEP: Add Redirect URIs to Google Cloud Console

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account (same one you used for Phase 1)
3. Select the **same project** you used for mcp-auth-demo

### Step 2: Navigate to OAuth Credentials
1. Click on **Navigation Menu** (☰) in top-left
2. Go to **APIs & Services** → **Credentials**
3. Under **OAuth 2.0 Client IDs**, click on your existing client
   - It should be the one you created in Phase 1
   - Type: "Web application"

### Step 3: Add Authorized Redirect URIs

Scroll down to **"Authorized redirect URIs"** section and add these **5 URIs**:

#### ✅ Required URIs for Rolldice MCP Server:

```
http://localhost:3000/api/auth/callback
http://127.0.0.1:3000/api/auth/callback
https://rolldice-mcpserver-delta.vercel.app/api/auth/callback
https://rolldice-mcpserver-delta.vercel.app/oauth/callback
https://rolldice-mcpserver-delta.vercel.app/api/auth/callback/google
```

#### 📝 What Each URI Does:

1. **`http://localhost:3000/api/auth/callback`**
   - For local development when testing on your machine
   - Used when you run `pnpm dev`

2. **`http://127.0.0.1:3000/api/auth/callback`**
   - Alternative localhost for compatibility
   - Some tools use 127.0.0.1 instead of localhost

3. **`https://rolldice-mcpserver-delta.vercel.app/api/auth/callback`**
   - **MAIN PRODUCTION CALLBACK**
   - This is your primary production OAuth callback

4. **`https://rolldice-mcpserver-delta.vercel.app/oauth/callback`**
   - Fallback callback for mcp-remote compatibility
   - Used by Claude Desktop integration

5. **`https://rolldice-mcpserver-delta.vercel.app/api/auth/callback/google`**
   - Google-specific callback endpoint
   - Alternative route for Google OAuth flow

### Step 4: Keep Your Existing URIs

**IMPORTANT:** Don't delete your existing redirect URIs from Phase 1!

Your mcp-auth-demo URIs should still be there:
- `https://mcp-auth-demo-green.vercel.app/api/auth/callback`
- `http://localhost:3000/api/auth/callback` (if different port)
- etc.

### Step 5: Save Changes
1. Click **"SAVE"** at the bottom
2. Wait for confirmation message
3. Your OAuth client is now configured for both projects!

---

## 🔑 Copy Your Credentials to Rolldice

### Step 1: Get Your Credentials
While still in Google Cloud Console:
1. Stay on the same OAuth client page
2. You'll see:
   - **Client ID:** Something like `123456789-xxxxx.apps.googleusercontent.com`
   - **Client Secret:** Click "SHOW" to reveal it

### Step 2: Add to `.env.local`
1. Open your rolldice project's `.env.local` file
2. Replace the placeholder values:

```env
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Use the SAME credentials from Phase 1!** You're sharing one OAuth client across both projects.

---

## ✅ Verification Checklist

After adding all URIs, verify:

- [ ] 5 redirect URIs added for rolldice-mcpserver
- [ ] All existing mcp-auth-demo URIs still present
- [ ] Changes saved successfully
- [ ] Client ID copied to rolldice `.env.local`
- [ ] Client Secret copied to rolldice `.env.local`
- [ ] Dev server restarted (`pnpm dev`)

---

## 🧪 Test Your Setup

### Test Local (Development)
```powershell
# Should return JSON metadata
Invoke-WebRequest -Uri "http://localhost:3000/.well-known/oauth-authorization-server"
```

### Test Discovery Endpoints
Visit these URLs in your browser:
- http://localhost:3000/.well-known/oauth-authorization-server
- http://localhost:3000/.well-known/oauth-protected-resource

Both should show JSON configuration.

### Test with VS Code Insiders
1. Open VS Code Insiders
2. Reload window (Ctrl+Shift+P → "Reload Window")
3. Try using the rolldice tool
4. You should see OAuth login prompt
5. After Google login, dice rolling should work

---

## 📊 Final Google Cloud Console Configuration

Your OAuth client should have **ALL** these redirect URIs:

### For MCP Auth Demo (Phase 1):
- `https://mcp-auth-demo-green.vercel.app/api/auth/callback`
- `https://mcp-auth-demo-green.vercel.app/oauth/callback`
- `http://localhost:3000/api/auth/callback` (if different port for demo)

### For Rolldice MCP Server (Phase 2):
- `http://localhost:3000/api/auth/callback`
- `http://127.0.0.1:3000/api/auth/callback`
- `https://rolldice-mcpserver-delta.vercel.app/api/auth/callback`
- `https://rolldice-mcpserver-delta.vercel.app/oauth/callback`
- `https://rolldice-mcpserver-delta.vercel.app/api/auth/callback/google`

**Total:** ~8 redirect URIs (depending on your Phase 1 setup)

---

## 🚨 Common Issues

### Issue: "Redirect URI mismatch"
**Solution:** 
- Double-check the exact URL in Google Cloud Console
- Make sure there are no trailing slashes
- Verify the protocol (http vs https)
- Check port numbers match (3000)

### Issue: "Invalid client"
**Solution:**
- Verify GOOGLE_CLIENT_ID in `.env.local` matches Google Cloud Console
- Check for extra spaces or quotes in .env.local
- Restart dev server after changing .env.local

### Issue: "Access blocked: Authorization Error"
**Solution:**
- Your OAuth client might need verification
- For development, add your email to "Test users" in OAuth consent screen
- Go to: APIs & Services → OAuth consent screen → Test users

---

## 🎯 Quick Reference

| Environment | Callback URL |
|-------------|--------------|
| **Local Dev** | `http://localhost:3000/api/auth/callback` |
| **Production** | `https://rolldice-mcpserver-delta.vercel.app/api/auth/callback` |
| **MCP Endpoint (Local)** | `http://localhost:3000/api/mcp` |
| **MCP Endpoint (Prod)** | `https://rolldice-mcpserver-delta.vercel.app/api/mcp` |

---

**Next:** After adding these URIs, proceed to update your `.env.local` file and restart your dev server!
