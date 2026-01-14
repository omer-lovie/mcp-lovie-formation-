#!/usr/bin/env node

import { chmod } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function makeExecutable() {
  const cliPath = resolve(__dirname, '../dist/cli.js');

  try {
    // Add executable permissions (755)
    await chmod(cliPath, 0o755);
    console.log('✅ Made dist/cli.js executable');
  } catch (error) {
    console.error('❌ Failed to make cli.js executable:', error.message);
    process.exit(1);
  }
}

makeExecutable();
