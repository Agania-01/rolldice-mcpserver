# Security Documentation

## Overview

The Roll Dice MCP Server implements enterprise-grade security through multiple layers:

1. **OAuth 2.1 Authentication** - Industry-standard authorization
2. **Arcjet Security** - Rate limiting, bot protection, and threat detection
3. **Structured Logging** - Comprehensive audit trail and monitoring
4. **Defense in Depth** - Multiple security controls working together

---

## Security Architecture

### Authentication Flow

```
Client → Arcjet Check → OAuth 2.1 Verification → MCP Handler
  ↓            ↓                    ↓                   ↓
Rate Limit  Bot Detection     Token Validation    Authorized Tool
  ↓            ↓                    ↓                   ↓
Shield      Allow/Deny          Access Granted      Roll Dice
```

### Security Layers

#### Layer 1: Arcjet Security (First Defense)

**Purpose**: Protect against automated attacks and abuse

**Components**:
- **Rate Limiting**: Token bucket algorithm
  - MCP Endpoint: 30 req/min in production, 100 req/min in dev
  - OAuth Endpoints: 60 req/min in production, 100 req/min in dev
  - Discovery Endpoints: 120 req/min in production, 200 req/min in dev

- **Bot Detection**: 
  - Blocks malicious bots
  - Allows legitimate bots (search engines, monitors)
  - Based on user agent, behavior patterns, and fingerprints

- **Shield**: 
  - Detects suspicious patterns
  - Analyzes request characteristics
  - Adaptive threat detection

**Configuration**: `lib/arcjet-config.ts`

**Modes**:
- Development: `DRY_RUN` (logs but doesn't block)
- Production: `LIVE` (actively blocks threats)

#### Layer 2: OAuth 2.1 Authentication (Authorization)

**Purpose**: Verify user identity and authorization

**Components**:
- Google OAuth identity provider
- PKCE (Proof Key for Code Exchange) with S256
- Token audience validation
- Token expiration verification
- Authorization code flow

**Endpoints**:
- Authorization: `/api/auth/authorize`
- Token Exchange: `/api/auth/token`
- Client Registration: `/api/auth/register`
- Callback: `/api/auth/callback`

**Discovery Endpoints** (RFC 8414, RFC 9728):
- Authorization Server: `/.well-known/oauth-authorization-server`
- Protected Resource: `/.well-known/oauth-protected-resource`

**Configuration**: 
- Auth logic: `lib/auth.ts`
- OAuth utilities: `lib/oauth-utils.ts`
- Environment variables: `.env.local`

#### Layer 3: Structured Logging (Visibility)

**Purpose**: Audit trail, monitoring, and incident response

**Log Types**:
- HTTP requests (method, path, status, duration, IP)
- Security events (blocked requests, failed auth)
- OAuth events (token issuance, validation)
- MCP protocol events (tool calls)
- Arcjet decisions (rate limits, bot detection)

**Log Format**: Structured JSON for easy parsing

**Sensitive Data**: Automatically redacted (tokens, passwords, secrets)

**Configuration**: `lib/logger.ts`

---

## Environment Variables

### Required for Production

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Arcjet API Key (get from https://app.arcjet.com)
ARCJET_KEY=ajkey_your-key-here

# Node Environment
NODE_ENV=production
```

### Optional

```bash
# Override base URL (auto-detected in Vercel)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

---

## Google Cloud Console Setup

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add your redirect URIs:

**Development**:
```
http://localhost:3000/api/auth/callback
```

**Production**:
```
https://your-domain.com/api/auth/callback
https://your-domain.vercel.app/api/auth/callback
```

7. Copy the **Client ID** and **Client Secret** to `.env.local`

### 2. Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Choose **External** (for public use) or **Internal** (for organization)
3. Fill in required fields:
   - App name: "Roll Dice MCP Server"
   - User support email
   - Developer contact email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Save and continue

---

## Arcjet Setup

### 1. Create Account

1. Visit [app.arcjet.com](https://app.arcjet.com)
2. Sign up with GitHub or email
3. Create a new project

### 2. Get API Key

1. From dashboard, navigate to **API Keys**
2. Create a new key
3. Copy the key (format: `ajkey_...`)
4. Add to `.env.local`:
   ```bash
   ARCJET_KEY=ajkey_your-key-here
   ```

### 3. Configure Rules (Optional)

The application comes with pre-configured rules in `lib/arcjet-config.ts`. You can customize:
- Rate limits
- Bot detection settings
- Shield sensitivity

To modify, edit `lib/arcjet-config.ts` and redeploy.

---

## Security Best Practices

### 1. Secrets Management

✅ **DO**:
- Store secrets in `.env.local` (gitignored)
- Use Vercel environment variables in production
- Rotate secrets regularly
- Use different secrets for dev/staging/production

❌ **DON'T**:
- Commit secrets to Git
- Share secrets in Slack/email
- Use production secrets in development
- Hardcode secrets in source code

### 2. Rate Limiting

The application implements adaptive rate limiting:

- **Burst Protection**: Token bucket allows legitimate bursts
- **IP-based**: Each IP address tracked separately
- **Endpoint-specific**: Different limits for different endpoints
- **Gradual Degradation**: Returns 429 with `Retry-After` header

**Best Practice**: Monitor rate limit metrics in Arcjet dashboard

### 3. OAuth Security

✅ **Implemented**:
- PKCE with S256 (prevents authorization code interception)
- Token audience validation (prevents token misuse)
- State parameter (prevents CSRF)
- Token expiration (limits token lifetime)
- Secure token storage (HTTP-only cookies not used for MCP)

**Best Practice**: Tokens expire after 1 hour (Google default)

### 4. Logging and Monitoring

✅ **Logged**:
- All HTTP requests with IP address
- Security events (blocked requests)
- OAuth events (successful/failed authentication)
- Arcjet decisions (rate limits, bot detection)

❌ **NOT Logged** (Redacted):
- Bearer tokens
- Passwords
- Client secrets
- Authorization headers
- Cookies

**Best Practice**: Review logs regularly for suspicious patterns

---

## Incident Response

### Suspected Unauthorized Access

1. **Identify**:
   - Check logs for unusual IP addresses
   - Look for high request volumes
   - Search for failed authentication attempts

2. **Contain**:
   - Temporarily block suspicious IPs in Arcjet dashboard
   - Rotate OAuth client secret in Google Cloud Console
   - Update `GOOGLE_CLIENT_SECRET` in environment variables

3. **Investigate**:
   - Review full audit trail in logs
   - Check Arcjet dashboard for patterns
   - Determine scope of access

4. **Recover**:
   - Issue new tokens to legitimate users
   - Document incident
   - Update security policies

### Rate Limit Abuse

1. **Identify**:
   - Monitor Arcjet dashboard for rate limit hits
   - Check logs for `rate_limit_exceeded` errors
   - Look for patterns (same IP, user agent)

2. **Response**:
   - Arcjet automatically blocks after threshold
   - Review IP address in logs
   - Determine if legitimate or attack
   - Adjust rate limits if needed (in `lib/arcjet-config.ts`)

### Bot Attack

1. **Identify**:
   - Arcjet bot detection fires
   - Check logs for `bot_detected` events
   - Review user agent strings

2. **Response**:
   - Arcjet automatically blocks bad bots
   - Good bots (search engines) are allowed
   - Review allowlist in `lib/arcjet-config.ts` if needed

---

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Request Volume**:
   - Total requests per minute
   - Requests per endpoint
   - Requests per IP

2. **Error Rates**:
   - 401 Unauthorized (failed auth)
   - 429 Rate Limited
   - 403 Forbidden (bot/shield)
   - 500 Server Errors

3. **Security Events**:
   - Arcjet denials
   - Failed OAuth attempts
   - Token validation failures

4. **Performance**:
   - Request duration
   - Token verification time
   - Database query time (if added)

### Recommended Alerting Thresholds

- **High Priority**:
  - 500 error rate > 1%
  - Arcjet denials > 100/min
  - Failed OAuth > 50/min

- **Medium Priority**:
  - 401 rate > 10%
  - 429 rate > 5%
  - Request duration > 2s

- **Low Priority**:
  - Normal bot blocks
  - Individual rate limits

### Tools

**Recommended**:
- **Arcjet Dashboard**: Real-time security metrics
- **Vercel Analytics**: Request volume and errors
- **Sentry**: Error tracking and alerting
- **Datadog/LogRocket**: Advanced monitoring

**Built-in**:
- Structured JSON logs (parse with jq, Elasticsearch, etc.)
- Vercel deployment logs
- Browser console (development)

---

## Compliance and Standards

### Implemented Standards

- **OAuth 2.1** (draft-ietf-oauth-v2-1): Modern authorization framework
- **RFC 8414**: OAuth 2.0 Authorization Server Metadata
- **RFC 9728**: OAuth 2.0 Protected Resource Metadata
- **RFC 7636**: PKCE for OAuth Public Clients
- **MCP 2025-06-18**: Model Context Protocol specification

### Security Headers

All endpoints include:
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *` (CORS for discovery)
- `Cache-Control: max-age=3600` (discovery endpoints)
- `WWW-Authenticate` (401 responses)
- `Retry-After` (429 responses)

### Data Protection

- **In Transit**: HTTPS/TLS enforced (Vercel)
- **At Rest**: No persistent storage (stateless)
- **In Memory**: Cleared after request
- **In Logs**: Sensitive data redacted

---

## Security Checklist

### Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Google OAuth redirect URIs configured
- [ ] Arcjet API key active
- [ ] HTTPS enforced
- [ ] OAuth consent screen published
- [ ] Security headers verified
- [ ] Rate limits tested
- [ ] Logs reviewed
- [ ] Monitoring configured
- [ ] Incident response plan documented

### Regular Maintenance

- [ ] Review logs weekly
- [ ] Check Arcjet dashboard daily
- [ ] Rotate secrets quarterly
- [ ] Update dependencies monthly
- [ ] Review access logs
- [ ] Test OAuth flow
- [ ] Verify rate limits
- [ ] Check error rates

---

## Troubleshooting

### "Rate limit exceeded" errors

**Cause**: Too many requests from same IP

**Solution**:
1. Check if legitimate burst of traffic
2. Review Arcjet dashboard for IP
3. Adjust rate limits in `lib/arcjet-config.ts` if needed
4. Wait for bucket refill (60 seconds)

### "Bot detected" errors

**Cause**: Arcjet detected automated client

**Solution**:
1. Verify user agent
2. Check if legitimate bot (search engine)
3. Add to allowlist in `lib/arcjet-config.ts` if needed
4. Use proper OAuth flow (not automated)

### "Token verification failed"

**Cause**: Invalid or expired token

**Solution**:
1. Check token expiration (1 hour)
2. Verify Google OAuth credentials
3. Ensure token audience matches
4. Check logs for specific error
5. Re-authenticate to get new token

### "ARCJET_KEY is required"

**Cause**: Missing environment variable

**Solution**:
1. Get key from [app.arcjet.com](https://app.arcjet.com)
2. Add to `.env.local` (development)
3. Add to Vercel environment variables (production)
4. Redeploy application

---

## Support and Resources

### Documentation

- [Arcjet Documentation](https://docs.arcjet.com)
- [OAuth 2.1 Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

### Community

- [Arcjet Discord](https://discord.gg/arcjet)
- [MCP GitHub Discussions](https://github.com/modelcontextprotocol/specification/discussions)

### Emergency Contacts

- Security issues: Rotate secrets immediately
- Service outages: Check Vercel status, Arcjet status
- Bug reports: Create GitHub issue (redact sensitive data)

---

## Change Log

### Version 1.0.0 (Current)

**Security Features**:
- OAuth 2.1 authentication with Google
- Arcjet rate limiting, bot protection, shield
- Structured JSON logging with sensitive data redaction
- Compliance with MCP 2025-06-18, RFC 8414, RFC 9728

**Known Limitations**:
- Single OAuth provider (Google only)
- IP-based rate limiting (shared IPs may hit limits)
- No persistent storage (stateless design)

**Future Enhancements**:
- Multiple OAuth providers (GitHub, Microsoft)
- User-based rate limiting (requires storage)
- Advanced threat intelligence
- SIEM integration
