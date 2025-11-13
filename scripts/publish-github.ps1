# PowerShell script to publish to GitHub Packages
# Usage: .\scripts\publish-github.ps1

Write-Host "📦 Publishing to GitHub Packages..." -ForegroundColor Cyan

# Backup original package.json
Copy-Item package.json package.json.backup

# Copy GitHub-specific package.json
Copy-Item package-github.json package.json -Force

try {
    # Build
    npm run build
    
    # Publish to GitHub Packages
    npm publish
    
    Write-Host "✅ Published to GitHub Packages!" -ForegroundColor Green
} finally {
    # Restore original package.json
    Copy-Item package.json.backup package.json -Force
    Remove-Item package.json.backup
}

