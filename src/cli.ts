/**
 * Main CLI entry point
 * Implements Commander.js for command routing
 * FR-003: Version and help commands
 * FR-004: Update checking
 */

import { Command } from 'commander';
import { startFormation, showVersion, showHelp } from './cli/commands';
import { formatWarning, print } from './cli/utils/formatter';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read package.json for version info
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

// Configure CLI metadata
program
  .name('lovie')
  .description('Company formation made simple - Form your US company in minutes')
  .version(packageJson.version, '-v, --version', 'Display version information')
  .helpOption('-h, --help', 'Display help information');

// Default command (no arguments) - start formation
program
  .action(() => {
    startFormation();
  });

// Start command (explicit)
program
  .command('start')
  .description('Start the company formation process')
  .action(() => {
    startFormation();
  });

// Check for updates on startup
// FR-004: Check for updates and notify users
async function checkForUpdates(): Promise<void> {
  try {
    // In production, this would check npm registry or a custom API
    // For now, we'll skip the actual check
    const hasUpdate = false; // Simulated

    if (hasUpdate) {
      print(formatWarning('\n⚠️  A new version of Lovie is available!'));
      print(formatWarning('Run "npm update -g lovie" to upgrade.\n'));
    }
  } catch (error) {
    // Silently fail - don't interrupt user experience
  }
}

/**
 * Main CLI entry point
 */
export async function main(argv: string[]): Promise<void> {
  // Check for updates in the background
  checkForUpdates();

  // Handle custom help
  if (argv.includes('--help') || argv.includes('-h')) {
    showHelp();
    return;
  }

  // Handle custom version
  if (argv.includes('--version') || argv.includes('-v')) {
    showVersion();
    return;
  }

  // Parse commands
  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Export for testing
export { program };
