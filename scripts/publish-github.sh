#!/bin/bash
# Script to publish to GitHub Packages
# Usage: ./scripts/publish-github.sh

set -e

echo "📦 Publishing to GitHub Packages..."

# Copy GitHub-specific package.json
cp package-github.json package.json

# Build
npm run build

# Publish to GitHub Packages
npm publish

# Restore original package.json
git checkout package.json

echo "✅ Published to GitHub Packages!"

