# Generate secrets for OAuth2-Proxy and save to .env.traefik
# PowerShell version for Windows

Write-Host "🔐 Generating secrets for Hudu MCP Server with OAuth" -ForegroundColor Cyan
Write-Host ""

# Check if .env.traefik exists
if (Test-Path ".env.traefik") {
    Write-Host "⚠️  .env.traefik already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to regenerate OAUTH2_COOKIE_SECRET? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Aborted. No changes made." -ForegroundColor Red
        exit 1
    }
}

# Generate OAuth2-Proxy cookie secret (32 bytes = 64 hex characters)
Write-Host "Generating OAuth2-Proxy cookie secret..." -ForegroundColor Green

# Generate random bytes and convert to hex
$bytes = New-Object byte[] 16
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
$COOKIE_SECRET = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ''

Write-Host "✅ Generated OAUTH2_COOKIE_SECRET" -ForegroundColor Green
Write-Host ""
Write-Host "Add this to your .env.traefik file:" -ForegroundColor Cyan
Write-Host ""
Write-Host "OAUTH2_COOKIE_SECRET=$COOKIE_SECRET" -ForegroundColor Yellow
Write-Host ""

# Optionally append to .env.traefik
$response = Read-Host "Append to .env.traefik automatically? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    if (Test-Path ".env.traefik") {
        # Read file content
        $content = Get-Content ".env.traefik" -Raw

        # Check if OAUTH2_COOKIE_SECRET already exists
        if ($content -match "OAUTH2_COOKIE_SECRET=") {
            # Replace existing value
            $content = $content -replace "OAUTH2_COOKIE_SECRET=.*", "OAUTH2_COOKIE_SECRET=$COOKIE_SECRET"
            Set-Content ".env.traefik" -Value $content -NoNewline
            Write-Host "✅ Updated OAUTH2_COOKIE_SECRET in .env.traefik" -ForegroundColor Green
        } else {
            # Append new value
            Add-Content ".env.traefik" -Value "`nOAUTH2_COOKIE_SECRET=$COOKIE_SECRET"
            Write-Host "✅ Added OAUTH2_COOKIE_SECRET to .env.traefik" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  .env.traefik not found. Creating from template..." -ForegroundColor Yellow
        Copy-Item ".env.traefik.example" ".env.traefik"
        $content = Get-Content ".env.traefik" -Raw
        $content = $content -replace "OAUTH2_COOKIE_SECRET=.*", "OAUTH2_COOKIE_SECRET=$COOKIE_SECRET"
        Set-Content ".env.traefik" -Value $content -NoNewline
        Write-Host "✅ Created .env.traefik with generated secret" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Edit .env.traefik and fill in remaining values:" -ForegroundColor Yellow
        Write-Host "   - AZURE_CLIENT_ID"
        Write-Host "   - AZURE_CLIENT_SECRET"
        Write-Host "   - CF_DNS_API_TOKEN"
        Write-Host "   - HUDU_API_KEY"
    }
}

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Complete Azure AD App Registration (see AZURE_AD_SETUP.md)"
Write-Host "2. Get Cloudflare API token for DNS challenge"
Write-Host "3. Fill in remaining values in .env.traefik"
Write-Host "4. Run: docker-compose -f docker-compose.traefik.yml up -d --build"
