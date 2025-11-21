# Deployment Guide

## Quick Deploy to Vercel

### 1. Prerequisites

- GitHub account
- Vercel account (free tier works)
- Google Cloud Console project
- Arcjet account

### 2. Deploy Steps

#### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit with OAuth 2.1 and Arcjet security"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rolldice-mcpserver.git
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Import Project**
3. Select your GitHub repository
4. Configure environment variables:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
ARCJET_KEY=ajkey_your-key-here
NODE_ENV=production
```

5. Click **Deploy**

#### Step 3: Configure Google OAuth Redirect URIs

After deployment, Vercel will give you a URL like `https://your-app.vercel.app`

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URIs:

```
https://your-app.vercel.app/api/auth/callback
```

5. Save

#### Step 4: Test Deployment

Visit your deployment URL and verify:
- [ ] Home page loads
- [ ] Discovery endpoints work:
  - `https://your-app.vercel.app/.well-known/oauth-authorization-server`
  - `https://your-app.vercel.app/.well-known/oauth-protected-resource`
- [ ] OAuth flow initiates (click test button on home page)

---

## Environment Configuration

### Development (.env.local)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-dev-client-secret

# Arcjet (use test key for development)
ARCJET_KEY=ajkey_test_your-dev-key

# Environment
NODE_ENV=development

# Optional: Override base URL
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)

Set these in Vercel dashboard under **Settings** > **Environment Variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `GOOGLE_CLIENT_ID` | Production client ID | Production |
| `GOOGLE_CLIENT_SECRET` | Production secret | Production |
| `ARCJET_KEY` | Production Arcjet key | Production |
| `NODE_ENV` | `production` | Production |

**Best Practice**: Use different OAuth credentials and Arcjet keys for dev/prod

---

## Domain Configuration

### Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** > **Domains**
2. Add your custom domain (e.g., `mcp.yourdomain.com`)
3. Follow DNS configuration instructions
4. Update Google OAuth redirect URIs to include custom domain:

```
https://mcp.yourdomain.com/api/auth/callback
```

### Multiple Environments

Vercel supports preview deployments:

- **Production**: `main` branch → `your-app.vercel.app`
- **Preview**: Other branches → `your-app-git-branch.vercel.app`

Configure environment variables separately for each.

---

## Build Configuration

### Vercel Settings

**Framework Preset**: Next.js

**Build Command**:
```bash
pnpm build
```

**Output Directory**: `.next`

**Install Command**:
```bash
pnpm install
```

**Development Command**:
```bash
pnpm dev
```

### Build Performance

The application uses:
- **Next.js 15** with App Router
- **Turbopack** for faster builds
- **Edge Runtime** compatible (if needed)

Typical build time: 60-90 seconds

---

## Security Hardening

### Production Checklist

- [x] OAuth 2.1 with PKCE (S256)
- [x] Arcjet rate limiting enabled
- [x] Arcjet bot protection enabled
- [x] Arcjet shield enabled
- [x] Structured logging with sensitive data redaction
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Environment variables secured

### Additional Security Headers (Optional)

Add to `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

---

## Monitoring Setup

### Vercel Analytics

Automatically enabled for all deployments. View in Vercel dashboard:
- Request volume
- Response times
- Status codes
- Geographic distribution

### Arcjet Dashboard

Monitor security metrics:
- Rate limit hits
- Bot detections
- Shield blocks
- Request patterns

Access at [app.arcjet.com](https://app.arcjet.com)

### Error Tracking (Optional)

#### Sentry Integration

1. Create account at [sentry.io](https://sentry.io)
2. Install SDK:

```bash
pnpm add @sentry/nextjs
```

3. Initialize:

```bash
npx @sentry/wizard@latest -i nextjs
```

4. Add DSN to environment variables

#### LogRocket (Optional)

1. Create account at [logrocket.com](https://logrocket.com)
2. Install SDK:

```bash
pnpm add logrocket
```

3. Initialize in layout.tsx

---

## Rollback Procedures

### Quick Rollback

1. Go to Vercel dashboard
2. Navigate to **Deployments**
3. Find last working deployment
4. Click **•••** > **Promote to Production**

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

---

## Scaling Considerations

### Current Limits

- **Vercel Free Tier**:
  - 100 GB bandwidth/month
  - 100 deployments/day
  - Unlimited requests

- **Arcjet Free Tier**:
  - 100,000 requests/month
  - All security features
  - Community support

### Scaling Up

When you exceed free tier limits:

1. **Vercel Pro** ($20/month):
   - 1 TB bandwidth
   - Priority support
   - Advanced analytics

2. **Arcjet Pro** (usage-based):
   - Unlimited requests
   - Priority support
   - Custom rules

3. **Optimization**:
   - Enable caching for discovery endpoints
   - Use CDN for static assets
   - Implement request batching

---

## Troubleshooting Deployment

### Build Failures

**Error**: "Module not found"
```bash
# Solution: Clean install
rm -rf node_modules .next
pnpm install
pnpm build
```

**Error**: "Environment variable missing"
```bash
# Solution: Check Vercel environment variables
# Ensure all required variables are set
```

### Runtime Errors

**Error**: "ARCJET_KEY is required"
```bash
# Solution: Add to Vercel environment variables
# Redeploy after adding
```

**Error**: "Token verification failed"
```bash
# Solution: Check Google OAuth configuration
# Verify redirect URIs match deployment URL
```

### Performance Issues

**Slow response times**:
1. Check Vercel Analytics for bottlenecks
2. Review Arcjet logs for rate limiting
3. Optimize token verification
4. Enable caching where appropriate

---

## Continuous Integration

### GitHub Actions (Optional)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm build
```

### Automated Testing

```bash
# Run before deployment
pnpm lint          # ESLint checks
pnpm type-check    # TypeScript checks
pnpm build         # Build verification
```

---

## Backup and Recovery

### Code Backup

- **GitHub**: Automatic version control
- **Vercel**: Stores all deployments
- **Local**: Keep `.env.local` backup (encrypted)

### Configuration Backup

Save these securely:
- Google OAuth credentials
- Arcjet API key
- Environment variable values
- Custom domain configuration

### Recovery Procedure

1. Clone repository
2. Restore environment variables
3. Deploy to Vercel
4. Update OAuth redirect URIs
5. Test endpoints
6. Verify security features

---

## Maintenance Schedule

### Daily

- [ ] Check Arcjet dashboard for anomalies
- [ ] Review Vercel deployment logs
- [ ] Monitor error rates

### Weekly

- [ ] Review security logs
- [ ] Check rate limit metrics
- [ ] Update dependencies (if needed)
- [ ] Test OAuth flow

### Monthly

- [ ] Review access patterns
- [ ] Analyze performance metrics
- [ ] Update documentation
- [ ] Plan feature additions

### Quarterly

- [ ] Rotate OAuth credentials
- [ ] Update Arcjet rules
- [ ] Security audit
- [ ] Dependency updates

---

## Support Contacts

### Platform Issues

- **Vercel**: support@vercel.com
- **Arcjet**: support@arcjet.com
- **Google Cloud**: Cloud Console support

### Documentation

- This guide: `DEPLOYMENT.md`
- Security: `SECURITY.md`
- API: `README.md`

### Emergency

- Deployment issues: Rollback to last working version
- Security breach: Rotate all secrets immediately
- Service outage: Check platform status pages
