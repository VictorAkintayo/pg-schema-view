# Quick Start: Publish to Both npm and GitHub Packages

## One-Time Setup

### 1. Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: "GitHub Packages"
4. Select scopes:
   - ✅ `write:packages`
   - ✅ `read:packages`
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

### 2. Configure npm for GitHub Packages

**Windows PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$npmrcPath = "$env:USERPROFILE\.npmrc"
"@victorakintayo:registry=https://npm.pkg.github.com" | Out-File -FilePath $npmrcPath -Encoding utf8
"//npm.pkg.github.com/:_authToken=$token" | Add-Content -FilePath $npmrcPath
```

**Linux/Mac:**
```bash
echo "@victorakintayo:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE" >> ~/.npmrc
```

### 3. Verify Setup

```bash
npm whoami --registry=https://npm.pkg.github.com
```

You should see your GitHub username.

## Publishing to Both

### Simple Method (Recommended)

```bash
npm run publish:both
```

This will:
1. ✅ Publish to npm as `pg-schema-view`
2. ✅ Publish to GitHub Packages as `@victorakintayo/pg-schema-view`

### With Version Bump

```bash
# Patch (1.1.2 → 1.1.3)
npm version patch && npm run publish:both

# Minor (1.1.2 → 1.2.0)
npm version minor && npm run publish:both

# Major (1.1.2 → 2.0.0)
npm version major && npm run publish:both
```

## What Happens

- **npm**: Your package appears at https://www.npmjs.com/package/pg-schema-view
- **GitHub Packages**: Your package appears at https://github.com/users/VictorAkintayo/packages/npm/package/pg-schema-view
- **GitHub Profile**: The package count increases on your GitHub profile

## Troubleshooting

**"401 Unauthorized"**
- Check your `.npmrc` file has the correct token
- Verify token hasn't expired

**"403 Forbidden"**
- Ensure token has `write:packages` permission
- Check package name matches your GitHub username

**Script fails**
- Make sure you've built the project: `npm run build`
- Ensure tests pass: `npm test`

## That's It! 🎉

After publishing, your package will be available on both registries and will count toward your GitHub Packages total.

