# Test Arcjet Integration
# This script sends requests to your MCP server to verify Arcjet is working

Write-Host "Testing Arcjet Integration" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if server is running
Write-Host "1. Checking if server is running on port 3000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   SUCCESS: Server is running (Status: $($response.StatusCode))`n" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Server is not running. Please run 'pnpm dev' first`n" -ForegroundColor Red
    exit 1
}

# Test 1: Discovery endpoint (should be protected by Arcjet)
Write-Host "2. Testing OAuth discovery endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/.well-known/oauth-authorization-server" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   SUCCESS: Discovery endpoint accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "   This request should appear in Arcjet dashboard`n" -ForegroundColor Cyan
} catch {
    Write-Host "   ERROR: Discovery endpoint failed: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: MCP endpoint without auth (should get 401)
Write-Host "3. Testing MCP endpoint without authentication..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/mcp" -Method POST -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   WARNING: Unexpected success (Status: $($response.StatusCode))" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "   SUCCESS: Correctly returned 401 Unauthorized" -ForegroundColor Green
        Write-Host "   This request should appear in Arcjet dashboard`n" -ForegroundColor Cyan
    } else {
        Write-Host "   ERROR: Unexpected error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

# Test 3: Rate limiting (send multiple requests)
Write-Host "4. Testing rate limiting (sending 5 requests quickly)..." -ForegroundColor Yellow
$successCount = 0
$rateLimitHit = $false

for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/.well-known/oauth-authorization-server" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $successCount++
        Write-Host "   Request $i : SUCCESS (Status $($response.StatusCode))" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 429) {
            Write-Host "   Request $i : RATE LIMITED (429)" -ForegroundColor Magenta
            $rateLimitHit = $true
        } else {
            Write-Host "   Request $i : ERROR $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 200
}

Write-Host ""
if ($rateLimitHit) {
    Write-Host "   SUCCESS: Rate limiting is working!" -ForegroundColor Green
} else {
    Write-Host "   INFO: No rate limit hit (in development, limits are higher)" -ForegroundColor Cyan
}
Write-Host "   All $successCount successful requests should appear in Arcjet dashboard`n" -ForegroundColor Cyan

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Check your Arcjet dashboard at:" -ForegroundColor Yellow
Write-Host "   https://app.arcjet.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "You should see:" -ForegroundColor Yellow
Write-Host "   - Request volume increasing" -ForegroundColor White
Write-Host "   - Geographic distribution (your location)" -ForegroundColor White
Write-Host "   - Decision logs (ALLOW for authenticated requests)" -ForegroundColor White
if ($rateLimitHit) {
    Write-Host "   - Rate limit hits" -ForegroundColor White
}
Write-Host ""
Write-Host "Tip: Refresh your dashboard to see the requests!" -ForegroundColor Cyan
