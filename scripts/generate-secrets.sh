#!/bin/bash
# Generate secrets for OAuth2-Proxy and save to .env.traefik

echo "🔐 Generating secrets for Hudu MCP Server with OAuth"
echo ""

# Check if .env.traefik exists
if [ -f ".env.traefik" ]; then
    echo "⚠️  .env.traefik already exists!"
    read -p "Do you want to regenerate OAuth2_COOKIE_SECRET? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. No changes made."
        exit 1
    fi
fi

# Generate OAuth2-Proxy cookie secret (32 bytes = 64 hex characters)
echo "Generating OAuth2-Proxy cookie secret..."
COOKIE_SECRET=$(openssl rand -hex 16)

echo "✅ Generated OAuth2_COOKIE_SECRET"
echo ""
echo "Add this to your .env.traefik file:"
echo ""
echo "OAUTH2_COOKIE_SECRET=$COOKIE_SECRET"
echo ""

# Optionally append to .env.traefik
read -p "Append to .env.traefik automatically? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f ".env.traefik" ]; then
        # Check if OAUTH2_COOKIE_SECRET already exists
        if grep -q "OAUTH2_COOKIE_SECRET=" .env.traefik; then
            # Replace existing value
            sed -i "s/OAUTH2_COOKIE_SECRET=.*/OAUTH2_COOKIE_SECRET=$COOKIE_SECRET/" .env.traefik
            echo "✅ Updated OAUTH2_COOKIE_SECRET in .env.traefik"
        else
            # Append new value
            echo "OAUTH2_COOKIE_SECRET=$COOKIE_SECRET" >> .env.traefik
            echo "✅ Added OAUTH2_COOKIE_SECRET to .env.traefik"
        fi
    else
        echo "⚠️  .env.traefik not found. Creating from template..."
        cp .env.traefik.example .env.traefik
        sed -i "s/OAUTH2_COOKIE_SECRET=.*/OAUTH2_COOKIE_SECRET=$COOKIE_SECRET/" .env.traefik
        echo "✅ Created .env.traefik with generated secret"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env.traefik and fill in remaining values:"
        echo "   - AZURE_CLIENT_ID"
        echo "   - AZURE_CLIENT_SECRET"
        echo "   - CF_DNS_API_TOKEN"
        echo "   - HUDU_API_KEY"
    fi
fi

echo ""
echo "✅ Done!"
echo ""
echo "Next steps:"
echo "1. Complete Azure AD App Registration (see AZURE_AD_SETUP.md)"
echo "2. Get Cloudflare API token for DNS challenge"
echo "3. Fill in remaining values in .env.traefik"
echo "4. Run: docker-compose -f docker-compose.traefik.yml up -d --build"
