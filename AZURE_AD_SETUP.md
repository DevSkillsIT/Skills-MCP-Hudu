# Azure AD App Registration Setup Guide

This guide walks you through creating an Azure AD App Registration for the Hudu MCP Server OAuth authentication.

---

## Prerequisites

- Global Administrator, Application Administrator, or Cloud Application Administrator role
- Azure AD Tenant ID: `7b80db37-11b2-4046-b65a-d1a4cf738372`
- MCP Server URL: `https://mcp.hudu.247mgmt.com`

---

## Step 1: Create App Registration

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** → **App registrations**
3. Click **New registration**

**Configuration:**
- **Name:** `Hudu MCP Server`
- **Supported account types:**
  - Select: **Accounts in this organizational directory only (Single tenant)**
- **Redirect URI:**
  - Platform: **Web**
  - URI: `https://mcp.hudu.247mgmt.com/oauth2/callback`
- Click **Register**

**Save these values:**
- **Application (client) ID:** `________________` (you'll need this)
- **Directory (tenant) ID:** `7b80db37-11b2-4046-b65a-d1a4cf738372` (already known)

---

## Step 2: Create Client Secret

1. In your new app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. **Description:** `Hudu MCP OAuth Secret`
4. **Expires:** 24 months (or custom)
5. Click **Add**

**IMPORTANT:** Copy the **Value** immediately - you won't see it again!
- **Client Secret Value:** `________________` (save securely)

---

## Step 3: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**

### Add Microsoft Graph Permissions:

**Delegated permissions:**
- Click **Microsoft Graph** → **Delegated permissions**
- Add the following:
  - ✅ `openid`
  - ✅ `profile`
  - ✅ `email`
  - ✅ `User.Read`
  - ✅ `GroupMember.Read.All` (to read user's group memberships)

3. Click **Add permissions**
4. Click **Grant admin consent for [Your Organization]**
5. Click **Yes** to confirm

**Result:** All permissions should show "Granted for [Your Organization]" in green

---

## Step 4: Configure Token Configuration (Optional - Enhanced Security)

1. Go to **Token configuration**
2. Click **Add optional claim**

### Add ID Token Claims:
- **Token type:** ID
- Select claims:
  - ✅ `email`
  - ✅ `family_name`
  - ✅ `given_name`
  - ✅ `upn` (User Principal Name)

3. Click **Add**

### Add Groups Claim:
1. Click **Add groups claim**
2. Select:
   - ✅ **Security groups**
3. Customize token properties:
   - ID: **Group ID**
   - Access: **Group ID**
4. Click **Add**

---

## Step 5: Configure App ID URI (For API Scopes)

1. Go to **Expose an API**
2. Click **Set** next to Application ID URI
3. Accept default: `api://<your-client-id>`
4. Click **Save**

### Add a Scope:

1. Click **Add a scope**
2. **Scope name:** `user_impersonation`
3. **Who can consent:** Admins and users
4. **Admin consent display name:** `Access Hudu MCP Server`
5. **Admin consent description:** `Allow the application to access Hudu MCP Server on behalf of the signed-in user`
6. **User consent display name:** `Access Hudu MCP Server`
7. **User consent description:** `Allow Hudu MCP Server to access Hudu data on your behalf`
8. **State:** Enabled
9. Click **Add scope**

**Result:** Scope URI: `api://<client-id>/user_impersonation`

---

## Step 6: Configure Authentication Settings

1. Go to **Authentication**
2. Under **Redirect URIs**, verify:
   - `https://mcp.hudu.247mgmt.com/oauth2/callback` ✅

### Advanced settings:

**Implicit grant and hybrid flows:**
- ✅ **ID tokens** (used for implicit and hybrid flows)

**Allow public client flows:**
- ❌ No (keep disabled)

**Supported account types:**
- ✅ Single tenant

3. Click **Save**

---

## Step 7: Configure Enterprise Application (Optional - Group Restrictions)

If you want to restrict access to specific Azure AD groups:

1. Go to **Azure Active Directory** → **Enterprise applications**
2. Find **Hudu MCP Server** application
3. Go to **Users and groups**
4. Click **Add user/group**
5. Select users or groups who should have access
6. Click **Assign**

---

## Step 8: Gather Configuration Values

You now have all values needed for OAuth2-Proxy configuration:

```env
# Azure AD Configuration
AZURE_TENANT_ID=7b80db37-11b2-4046-b65a-d1a4cf738372
AZURE_CLIENT_ID=<from Step 1>
AZURE_CLIENT_SECRET=<from Step 2>

# OAuth Endpoints (Auto-derived)
OIDC_ISSUER_URL=https://login.microsoftonline.com/7b80db37-11b2-4046-b65a-d1a4cf738372/v2.0
AZURE_TENANT_DOMAIN=<your-tenant>.onmicrosoft.com
```

---

## Step 9: Test OAuth Endpoints

Verify your Azure AD configuration is correct:

### Test OpenID Configuration:
```bash
curl https://login.microsoftonline.com/7b80db37-11b2-4046-b65a-d1a4cf738372/v2.0/.well-known/openid-configuration
```

**Expected:** JSON response with `authorization_endpoint`, `token_endpoint`, etc.

### Test JWKS Endpoint:
```bash
curl https://login.microsoftonline.com/7b80db37-11b2-4046-b65a-d1a4cf738372/discovery/v2.0/keys
```

**Expected:** JSON with public keys for JWT validation

---

## Security Best Practices

### Client Secret Management:
- ✅ Store in `.env.traefik` file (NOT committed to git)
- ✅ Rotate secrets every 6-12 months
- ✅ Use Azure Key Vault for production (advanced)

### App Registration Security:
- ✅ Enable app-level consent policy
- ✅ Restrict redirect URIs to exact matches
- ✅ Monitor sign-in logs regularly
- ✅ Enable Conditional Access policies (requires Azure AD P1)

### Audit Logging:
- ✅ Review **Sign-in logs** in Azure AD regularly
- ✅ Check for failed authentication attempts
- ✅ Monitor for suspicious OAuth grant patterns

---

## Troubleshooting

### Error: "AADSTS50011: The reply URL specified in the request does not match"
**Solution:** Verify redirect URI in Azure AD exactly matches: `https://mcp.hudu.247mgmt.com/oauth2/callback`

### Error: "AADSTS65001: The user or administrator has not consented"
**Solution:** Grant admin consent in **API permissions** section

### Error: "AADSTS700016: Application not found in directory"
**Solution:** Verify tenant ID is correct: `7b80db37-11b2-4046-b65a-d1a4cf738372`

### Users can't access despite having permissions
**Solution:** Check **Enterprise Applications** → **Users and groups** - ensure users/groups are assigned

---

## Testing OAuth Flow

After completing Azure AD setup, test the OAuth flow:

1. **Start OAuth2-Proxy** (see DEPLOYMENT_GUIDE.md)
2. **Visit:** `https://mcp.hudu.247mgmt.com`
3. **Expected flow:**
   - Redirects to Microsoft login page
   - User enters credentials
   - User consents to permissions (first time only)
   - Redirects back to `https://mcp.hudu.247mgmt.com/oauth2/callback`
   - User sees authenticated page or token portal

**Successful authentication = Azure AD setup complete!** ✅

---

## Next Steps

After Azure AD setup is complete:

1. ✅ Save Client ID and Client Secret to `.env.traefik`
2. → Proceed to **DEPLOYMENT_GUIDE.md** for Docker Compose setup
3. → Configure Traefik and OAuth2-Proxy
4. → Deploy the stack and test end-to-end

---

## Reference Links

- [Azure AD App Registration Documentation](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)
- [OAuth2-Proxy Azure AD Provider](https://oauth2-proxy.github.io/oauth2-proxy/docs/configuration/oauth_provider#azure-auth-provider)
- [Microsoft Identity Platform Scopes](https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc)
- [Azure AD Token Configuration](https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens)

---

**Questions or Issues?**
- Check Azure AD **Sign-in logs** for authentication errors
- Review **Enterprise applications** → **Sign-in activity**
- Verify all URLs use `https://` (not `http://`)
- Ensure Redirect URI has no trailing slash
