# Publishing to Both npm and GitHub Packages

This guide explains how to publish your package to both **npm** (npmjs.com) and **GitHub Packages**.

## Setup

### 1. Authenticate with GitHub Packages

First, you need to create a Personal Access Token (PAT) for GitHub Packages:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "GitHub Packages"
4. Select scopes:
   - ✅ `write:packages` (to publish packages)
   - ✅ `read:packages` (to read packages)
   - ✅ `delete:packages` (optional, to delete packages)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

### 2. Configure npm for GitHub Packages

Create or edit `~/.npmrc` (or `C:\Users\YourName\.npmrc` on Windows):

```ini
@victorakintayo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN_HERE
```

Replace `YOUR_GITHUB_TOKEN_HERE` with your actual token.

**On Windows PowerShell:**
```powershell
# Create the file
New-Item -Path "$env:USERPROFILE\.npmrc" -ItemType File -Force

# Add the configuration
Add-Content -Path "$env:USERPROFILE\.npmrc" -Value "@victorakintayo:registry=https://npm.pkg.github.com"
Add-Content -Path "$env:USERPROFILE\.npmrc" -Value "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN_HERE"
```

**On Linux/Mac:**
```bash
echo "@victorakintayo:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN_HERE" >> ~/.npmrc
```

### 3. Verify Authentication

```bash
npm whoami --registry=https://npm.pkg.github.com
```

You should see your GitHub username.

## Publishing

### Option 1: Publish to Both (Recommended)

```bash
npm run publish:both
```

This will:
1. Publish to npm (as `pg-schema-view`)
2. Publish to GitHub Packages (as `@victorakintayo/pg-schema-view`)

### Option 2: Publish Separately

**To npm only:**
```bash
npm publish
```

**To GitHub Packages only:**
```bash
npm run publish:github
```

### Option 3: Version Bump + Publish Both

```bash
# Patch version (1.1.2 → 1.1.3)
npm version patch && npm run publish:both

# Minor version (1.1.2 → 1.2.0)
npm version minor && npm run publish:both

# Major version (1.1.2 → 2.0.0)
npm version major && npm run publish:both
```

## Package Names

- **npm**: `pg-schema-view` (unscoped)
- **GitHub Packages**: `@victorakintayo/pg-schema-view` (scoped)

Both packages contain the same code but have different names because:
- npm allows unscoped names
- GitHub Packages requires scoped names (format: `@username/package-name`)

## Installation

Users can install from either registry:

**From npm:**
```bash
npm install -g pg-schema-view
```

**From GitHub Packages:**
```bash
# First, configure npm to use GitHub Packages for this scope
echo "@victorakintayo:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_TOKEN" >> ~/.npmrc

# Then install
npm install -g @victorakintayo/pg-schema-view
```

## GitHub Packages Visibility

After publishing, your package will appear:
- On your GitHub profile under "Packages"
- At: `https://github.com/users/VictorAkintayo/packages/npm/package/pg-schema-view`
- In your repository's "Packages" section (if enabled)

## Troubleshooting

### "401 Unauthorized"
- Check your `.npmrc` file has the correct token
- Verify the token hasn't expired
- Ensure the token has `write:packages` permission

### "403 Forbidden"
- Make sure the package name matches your GitHub username/organization
- Check repository permissions if using an organization

### "Package name must be scoped"
- GitHub Packages requires scoped names (e.g., `@username/package-name`)
- The `package-github.json` file handles this automatically

### "Package already exists"
- Delete the old version from GitHub Packages if needed
- Or increment the version number

## Automated Publishing

The GitHub Actions workflow (`.github/workflows/publish-github-packages.yml`) can automatically publish to GitHub Packages when you create a release.

To trigger it manually:
1. Go to Actions tab in your GitHub repository
2. Select "Publish to GitHub Packages"
3. Click "Run workflow"

## Security Note

**Never commit your GitHub token to the repository!**

- Store it in `.npmrc` (which is in `.gitignore`)
- Use environment variables in CI/CD
- Use GitHub Secrets for Actions workflows

