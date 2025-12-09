# Deployment Guide - Existing Traefik Setup
## Integrating Hudu MCP with Your Running Traefik Instance

**For systems with Traefik already deployed**

---

## 📋 Overview

Your existing Traefik configuration:
- **Traefik version:** latest
- **Network:** `Internal` (external network)
- **TLS:** Cloudflare DNS challenge
- **Cert resolver:** `Cloudflare`
- **Email:** admin@yourcompany.com
- **Cloudflare API Key:** Already configured

**What we're adding:**
- OAuth2-Proxy (for Azure AD authentication)
- Hudu MCP Server (with OAuth user context)
- Token Portal (self-service tokens)

All services connect to your existing `Internal` network and use your existing Traefik for routing.

---

## 🚀 Quick Start (10 Minutes)

### Step 1: Complete Azure AD Setup (5 min)

Follow [AZURE_AD_SETUP.md](AZURE_AD_SETUP.md) to:
1. Create App Registration
2. Generate Client Secret
3. Configure API permissions
4. Grant admin consent

**Save these values:**
- **Client ID:** `________________`
- **Client Secret:** `________________`

---

### Step 2: Configure Environment (3 min)

1. **Copy the environment template:**
```bash
cd /path/to/hudu-mcp
cp .env.traefik.example .env.traefik
```

2. **Edit `.env.traefik`:**
```env
# Hudu Configuration
HUDU_BASE_URL=https://hudu.example.com
HUDU_API_KEY=your-hudu-api-key-here

# Azure AD
AZURE_TENANT_ID=7b80db37-11b2-4046-b65a-d1a4cf738372
AZURE_CLIENT_ID=your-azure-client-id-from-step-1
AZURE_CLIENT_SECRET=your-azure-client-secret-from-step-1
AZURE_TENANT_DOMAIN=yourcompany.onmicrosoft.com
OAUTH2_EMAIL_DOMAINS=yourcompany.com,example.com

# Server (using your existing Cloudflare setup)
MCP_HOSTNAME=mcp.hudu.example.com
MCP_SERVER_IP=10.0.0.10

# MCP Server settings
MCP_SERVER_PORT=3050
NODE_ENV=production
LOG_LEVEL=info
```

3. **Generate OAuth2-Proxy cookie secret:**
```powershell
# Windows PowerShell
powershell -File scripts/generate-secrets.ps1

# Or manually:
openssl rand -hex 16
```

Add to `.env.traefik`:
```env
OAUTH2_COOKIE_SECRET=<generated-value>
```

**Note:** You don't need `CF_DNS_API_TOKEN` or `LETSENCRYPT_EMAIL` since you're using your existing Traefik!

---

### Step 3: Configure DNS (2 min)

#### Option A: Using Existing Cloudflare Setup

Since your Traefik already has Cloudflare configured, just add the DNS record:

**In Cloudflare Dashboard:**
- **Type:** A
- **Name:** `mcp.hudu`
- **Content:** Your public IP (same as your other services)
- **Proxy:** Disabled (orange cloud OFF) - for Let's Encrypt validation
- **TTL:** Auto

**Internal DNS (corp.yourcompany.com):**
- **Type:** A
- **Name:** `mcp.hudu.example.com`
- **Content:** `10.0.0.10`

**Verify DNS:**
```bash
nslookup mcp.hudu.example.com
# Should return: 10.0.0.10 (internal) or your public IP
```

---

### Step 4: Deploy Services (1 min)

**Using the existing Traefik docker-compose file:**

```bash
# Navigate to Hudu MCP directory
cd /path/to/hudu-mcp

# Build and start services (NOT including Traefik - it's already running)
docker-compose -f docker-compose.existing-traefik.yml up -d --build

# Check status
docker-compose -f docker-compose.existing-traefik.yml ps
```

**Expected output:**
```
✅ hudu-mcp-oauth2-proxy  ... Up (healthy)
✅ hudu-mcp-server        ... Up (healthy)
✅ hudu-mcp-token-portal  ... Up (healthy)
```

**Your existing Traefik continues running unchanged!**

---

## 🔍 Verify Integration

### Test 1: Check Traefik Routes

```bash
# Check Traefik dashboard (if enabled)
# Visit: http://traefik.docker.example.com:8080

# Or check Docker networks
docker network inspect Internal
```

**You should see:**
- `hudu-mcp-oauth2-proxy`
- `hudu-mcp-server`
- `hudu-mcp-token-portal`

Connected to the `Internal` network.

---

### Test 2: Test SSL Certificate

```bash
# Check certificate (should use your existing Cloudflare cert)
curl -I https://mcp.hudu.example.com

# Expected:
# HTTP/2 200
# server: traefik
```

**From browser:** Visit `https://mcp.hudu.example.com`
- Should show green padlock (your existing Let's Encrypt cert)
- Should redirect to Azure AD login

---

### Test 3: OAuth Flow

1. **Visit:** `https://mcp.hudu.example.com`
2. **Expected:**
   - Redirects to `login.microsoftonline.com`
   - Shows Microsoft login page
3. **Login** with your Azure AD credentials
4. **Expected:**
   - Redirects back to `mcp.hudu.example.com`
   - Shows authenticated page

✅ **Success!** OAuth working with your existing Traefik!

---

### Test 4: Token Portal

1. **Visit:** `https://mcp.hudu.example.com/token`
2. **Login** with Azure AD (if not already authenticated)
3. **Expected:**
   - See your name and email
   - See your access token
   - Can copy token to clipboard

✅ **Success!** Token portal working!

---

## 🔧 Architecture with Your Existing Traefik

```
┌──────────────────┐
│  Claude Desktop  │
│   (5 users)      │
└────────┬─────────┘
         │ Bearer Token
         ▼
┌─────────────────────────────────────────┐
│  Your Existing Traefik                  │
│  Container: traefik                     │
│  Network: Internal                      │
│  - Cloudflare TLS (already configured)  │
│  - Routes: *.example.com                │
└────────┬────────────────────────────────┘
         │ Routes to OAuth2-Proxy
         ▼
┌─────────────────────────────────────────┐
│  OAuth2-Proxy (NEW)                     │
│  Network: Internal + hudu-mcp-network   │
│  - Azure AD validation                  │
│  - ForwardAuth middleware               │
└────────┬────────────────────────────────┘
         │ Injects user headers
         ▼
┌─────────────────────────────────────────┐
│  Hudu MCP Server (NEW)                  │
│  Network: Internal + hudu-mcp-network   │
│  - Receives user context                │
│  - Logs user email                      │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Hudu API                               │
└─────────────────────────────────────────┘
```

---

## 📊 Monitoring

### View Logs:

```bash
# All Hudu MCP services
docker-compose -f docker-compose.existing-traefik.yml logs -f

# Specific service
docker-compose -f docker-compose.existing-traefik.yml logs -f oauth2-proxy
docker-compose -f docker-compose.existing-traefik.yml logs -f hudu-mcp-server

# Your existing Traefik logs
docker logs traefik -f
```

### Log Files:

- **MCP Server:** `./logs/combined-YYYY-MM-DD.log`
- **MCP Errors:** `./logs/error-YYYY-MM-DD.log`
- **Your Traefik:** `./Traefik/access.log` (your existing path)

### User Activity Logs:

```json
{
  "level": "info",
  "message": "Tool execution started",
  "toolName": "companies.query",
  "user": "admin@yourcompany.com",
  "userGroups": ["IT-Admins"],
  "timestamp": "2025-10-24T10:30:00.000Z"
}
```

---

## 🔧 Maintenance

### Updating Hudu MCP Services

```bash
cd /path/to/hudu-mcp

# Pull latest code
git pull origin main

# Rebuild and restart (Traefik stays running)
docker-compose -f docker-compose.existing-traefik.yml up -d --build

# Check logs
docker-compose -f docker-compose.existing-traefik.yml logs -f
```

**Your Traefik is NOT affected!**

---

### Adding More Traefik Networks

If you need Hudu MCP services on additional Traefik networks:

Edit `docker-compose.existing-traefik.yml`:

```yaml
networks:
  hudu-mcp-network:
    driver: bridge
  Internal:
    external: true
  n8n:  # ADD YOUR NETWORKS HERE
    external: true
  n8n-smarketing:
    external: true
```

Then add to each service:
```yaml
services:
  oauth2-proxy:
    networks:
      - hudu-mcp-network
      - Internal
      - n8n  # Add additional networks
```

---

## 🚨 Troubleshooting

### Problem: Services can't reach Traefik

**Check network connectivity:**
```bash
# Verify services are on Internal network
docker network inspect Internal

# Should show:
# - traefik (your existing)
# - hudu-mcp-oauth2-proxy
# - hudu-mcp-server
# - hudu-mcp-token-portal
```

**Solution:**
```bash
# Restart services to reconnect to network
docker-compose -f docker-compose.existing-traefik.yml restart
```

---

### Problem: Certificate not working

**Verify Traefik cert resolver:**
```bash
# Check your Traefik labels use 'Cloudflare' (capital C)
docker logs traefik | grep -i certificate
```

**Solution:**
Your docker-compose labels already use `Cloudflare`:
```yaml
- "traefik.http.routers.*.tls.certresolver=Cloudflare"
```

This matches your existing Traefik configuration.

---

### Problem: OAuth2-Proxy can't reach MCP server

**Check internal network:**
```bash
docker network inspect hudu-mcp-network

# Should show:
# - hudu-mcp-oauth2-proxy
# - hudu-mcp-server
# - hudu-mcp-token-portal
```

**Test connectivity:**
```bash
docker exec hudu-mcp-oauth2-proxy wget -O- http://hudu-mcp-server:3050/health
# Expected: {"status":"healthy",...}
```

---

### Problem: Traefik not routing to services

**Check Traefik can see containers:**
```bash
# Traefik should auto-discover containers with traefik.enable=true
docker logs traefik | grep -i hudu

# Force Traefik to re-scan
docker restart traefik
```

**Verify labels:**
```bash
docker inspect hudu-mcp-server | grep -i traefik
# Should show all traefik.* labels
```

---

## 🔒 Security Notes

### Traefik Network Isolation

✅ **Good:** Services communicate on separate networks:
- `hudu-mcp-network` - Internal communication between MCP services
- `Internal` - Communication with Traefik (shared with your other services)

✅ **Good:** Traefik provides network segmentation
✅ **Good:** OAuth2-Proxy adds authentication layer
✅ **Good:** MCP Server never directly exposed to internet

### Cloudflare API Key

⚠️ **Note:** Your Cloudflare API key is in your Traefik docker-compose

**Recommendation:**
```bash
# Move to .env file (more secure)
# In your Traefik directory, create .env:
CF_API_EMAIL=admin@yourcompany.com
CF_API_KEY=your-cloudflare-global-api-key

# Update docker-compose to use:
environment:
  - CF_API_EMAIL=${CF_API_EMAIL}
  - CF_API_KEY=${CF_API_KEY}
```

---

## 👥 User Onboarding

Same as standalone deployment:

1. **Admin:** Send users: `https://mcp.hudu.example.com/token`
2. **Users:** Follow [USER_ONBOARDING.md](USER_ONBOARDING.md)
3. **Users:** Configure Claude Desktop with their token

**Estimated time:** 5 minutes per user

---

## 📚 Key Differences from Standalone

| Aspect | Standalone Deploy | Your Setup |
|--------|------------------|------------|
| **Traefik** | New container | Use existing |
| **Network** | mcp-network only | Internal + hudu-mcp-network |
| **TLS** | New cert resolver | Use existing Cloudflare |
| **Docker Compose** | `docker-compose.traefik.yml` | `docker-compose.existing-traefik.yml` |
| **Services** | 4 containers | 3 containers (no Traefik) |
| **Cloudflare** | New API token | Use existing |

---

## ✅ Deployment Checklist

**Pre-deployment:**
- [ ] Azure AD App Registration completed
- [ ] `.env.traefik` configured
- [ ] OAuth2 cookie secret generated
- [ ] DNS A record added (`mcp.hudu.example.com`)
- [ ] Verified `Internal` network exists
- [ ] Backed up existing Traefik config

**Deployment:**
- [ ] Built services: `docker-compose -f docker-compose.existing-traefik.yml up -d --build`
- [ ] All 3 containers healthy
- [ ] Services appear in `Internal` network
- [ ] Traefik routing to services (check `docker logs traefik`)

**Testing:**
- [ ] HTTPS works: `https://mcp.hudu.example.com`
- [ ] Certificate valid (green padlock)
- [ ] Azure AD login works
- [ ] Token portal accessible
- [ ] User can get token
- [ ] Claude Desktop connects with token

**Production:**
- [ ] Test with your account first
- [ ] Onboard 1-2 users for UAT
- [ ] Monitor logs for issues
- [ ] Deploy to remaining 3 users
- [ ] Document for future reference

---

## 💡 Pro Tips

**Managing Multiple Stacks:**
```bash
# Start/stop Hudu MCP without affecting Traefik
docker-compose -f docker-compose.existing-traefik.yml up -d
docker-compose -f docker-compose.existing-traefik.yml down

# Your Traefik continues running!
```

**Viewing Combined Logs:**
```bash
# All Traefik-routed services (including Hudu MCP)
docker logs traefik --tail 100 -f

# Filter for MCP traffic
docker logs traefik -f | grep mcp.hudu
```

**Network Troubleshooting:**
```bash
# List all containers on Internal network
docker network inspect Internal --format='{{range .Containers}}{{.Name}} {{end}}'
```

---

## 🎯 Success Criteria

**Deployment successful when:**

✅ All 3 new containers healthy
✅ Services visible in `Internal` network
✅ Traefik routes traffic to services
✅ SSL certificate valid (using your Cloudflare cert)
✅ Azure AD login works
✅ Token portal displays tokens
✅ Users configure Claude Desktop
✅ MCP tools work from Claude Desktop
✅ Logs show user email for audit
✅ **Your existing Traefik services continue working unchanged**

**Ready for production!** 🚀

---

## 📞 Support

**Questions about integration?**
- Check `docker logs traefik`
- Check `docker network inspect Internal`
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Everything working?**
- Proceed with [USER_ONBOARDING.md](USER_ONBOARDING.md)
- Onboard your 5 users
- Monitor logs for first week

---

**Next:** Deploy with `docker-compose -f docker-compose.existing-traefik.yml up -d --build` 🚀
