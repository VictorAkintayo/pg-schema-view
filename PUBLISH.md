# Publishing Guide

## Prerequisites

1. **Create an npm account** (if you don't have one):
   - Go to https://www.npmjs.com/signup
   - Verify your email

2. **Login to npm**:
   ```bash
   npm login
   ```
   Enter your username, password, and email when prompted.

## Publishing Steps

### 1. Update Version

Update the version in `package.json` using semantic versioning:

- **Patch** (1.1.0 → 1.1.1): Bug fixes
- **Minor** (1.1.0 → 1.2.0): New features, backward compatible
- **Major** (1.1.0 → 2.0.0): Breaking changes

You can use npm version commands:
```bash
npm version patch   # 1.1.0 → 1.1.1
npm version minor   # 1.1.0 → 1.2.0
npm version major   # 1.1.0 → 2.0.0
```

Or manually edit `package.json` and update the version field.

### 2. Build the Project

```bash
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### 3. Run Tests (Optional but Recommended)

```bash
npm test
```

### 4. Check What Will Be Published

Preview what files will be included:
```bash
npm pack --dry-run
```

This creates a tarball preview without publishing.

### 5. Publish to npm

**For public package** (default):
```bash
npm publish
```

**For scoped package** (if package name is `@yourname/pg-schema-view`):
```bash
npm publish --access public
```

### 6. Verify Publication

Check your package on npm:
- Visit: https://www.npmjs.com/package/pg-schema-view
- Or run: `npm view pg-schema-view`

## Quick Publish Script

You can add this to your `package.json` scripts:

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm test",
    "publish:patch": "npm version patch && npm publish",
    "publish:minor": "npm version minor && npm publish",
    "publish:major": "npm version major && npm publish"
  }
}
```

Then use:
```bash
npm run publish:patch
```

## Updating an Existing Package

1. Make your changes
2. Update version: `npm version patch` (or minor/major)
3. Build: `npm run build`
4. Test: `npm test`
5. Publish: `npm publish`

## Important Notes

- **Never publish with `--force`** unless absolutely necessary
- **Test locally first**: `npm install -g .` to test the CLI
- **Check package size**: Keep it reasonable (< 10MB recommended)
- **Tag releases**: Consider using git tags: `git tag v1.1.0 && git push --tags`

## Troubleshooting

### "You do not have permission to publish"
- Check if the package name is already taken
- Verify you're logged in: `npm whoami`
- If package exists, you need to be added as a maintainer

### "Package name already exists"
- Choose a different name in `package.json`
- Or use a scoped package: `@yourusername/pg-schema-view`

### "Invalid package.json"
- Ensure all required fields are present
- Check for syntax errors in `package.json`

