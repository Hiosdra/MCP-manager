#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');

const electronPath = require('electron');
const appPath = path.resolve(__dirname, '..');

try {
  execFileSync(electronPath, [appPath], { stdio: 'inherit' });
} catch (err) {
  process.exit(err.status ?? 1);
}
