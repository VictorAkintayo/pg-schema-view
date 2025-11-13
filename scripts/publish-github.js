#!/usr/bin/env node

/**
 * Run this script to publish to GitHub Packages
 * Temporarily scopes the package name for GitHub Packages
 */

const { readFileSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageGithubPath = path.join(__dirname, '..', 'package-github.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const packageGithub = JSON.parse(readFileSync(packageGithubPath, 'utf-8'));

// Update version in package-github.json to match package.json
packageGithub.version = packageJson.version;

// Write updated package-github.json
writeFileSync(packageGithubPath, JSON.stringify(packageGithub, null, 2) + '\n');

// Save original package.json
const originalPackageJson = JSON.parse(JSON.stringify(packageJson));

try {
  console.log(`Publishing @victorakintayo/pg-schema-view@${packageGithub.version} to GitHub Packages...`);
  
  // Temporarily replace package.json with package-github.json content
  // (keeping all fields from package.json but using scoped name and publishConfig)
  const tempPackageJson = {
    ...packageJson,
    name: packageGithub.name,
    publishConfig: packageGithub.publishConfig
  };
  
  writeFileSync(packageJsonPath, JSON.stringify(tempPackageJson, null, 2) + '\n');
  
  // Change to project root
  process.chdir(path.join(__dirname, '..'));
  
  // Publish to GitHub Packages
  execSync('npm publish --registry=https://npm.pkg.github.com', { stdio: 'inherit' });
  
  console.log('✓ Successfully published to GitHub Packages!');
  console.log(`  Package: @victorakintayo/pg-schema-view@${packageGithub.version}`);
  console.log(`  View at: https://github.com/users/VictorAkintayo/packages/npm/package/pg-schema-view`);
} catch (error) {
  console.error('✗ Failed to publish to GitHub Packages:', error.message);
  console.error('\nMake sure you have:');
  console.error('1. Created a GitHub Personal Access Token with write:packages permission');
  console.error('2. Configured ~/.npmrc with:');
  console.error('   @victorakintayo:registry=https://npm.pkg.github.com');
  console.error('   //npm.pkg.github.com/:_authToken=YOUR_TOKEN');
  process.exit(1);
} finally {
  // Restore original package.json
  writeFileSync(packageJsonPath, JSON.stringify(originalPackageJson, null, 2) + '\n');
  console.log('Restored package.json to original configuration');
}
