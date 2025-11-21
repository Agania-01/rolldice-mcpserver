# Quick Commands to Test Arcjet

## Option A: Deploy to Vercel (Fastest to see dashboard)

```powershell
# 1. Deploy
vercel --prod

# 2. Set environment variables in Vercel dashboard:
#    - ARCJET_KEY=ajkey_01kajy6s6wf3b8vfr9q8yp0th1
#    - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI, ISSUER
#    - NODE_ENV=production

# 3. Visit your deployed URL

# 4. Check dashboard at: https://app.arcjet.com
```

## Option B: Production Build Locally

```powershell
# Terminal 1: Start production server
$env:NODE_ENV='production'
pnpm build
pnpm start

# Terminal 2: Send test requests
Invoke-WebRequest http://localhost:3000/.well-known/oauth-authorization-server -UseBasicParsing

# Rapid fire to test rate limiting:
1..10 | ForEach-Object {
    Write-Host "Request $_"
    Invoke-WebRequest http://localhost:3000/.well-known/oauth-authorization-server -UseBasicParsing
    Start-Sleep -Milliseconds 100
}

# Check dashboard: https://app.arcjet.com
```

## What You'll See

1. **Request volume** increasing in real-time
2. **Geographic map** showing your location
3. **Decision logs** - each request logged with ALLOW/DENY
4. **Rate limit violations** if you hit the limits

## Current Setup

✅ Arcjet key: `ajkey_01kajy6s6wf3b8vfr9q8yp0th1`
✅ Rate limits:
   - MCP endpoint: 30 requests/minute
   - OAuth endpoints: 60 requests/minute
   - Discovery endpoint: 120 requests/minute
✅ Bot protection: Enabled
✅ Shield protection: Enabled
✅ Structured logging: Enabled

The dashboard will update within seconds of receiving traffic!
