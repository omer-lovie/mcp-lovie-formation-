#!/usr/bin/env node

/**
 * Lovie CLI - Company Formation Made Simple
 * Main entry point
 */

// Load environment variables FIRST before any other imports
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import { Command } from 'commander';
import { startFormationFlow } from './cli/formationFlow';
import chalk from 'chalk';

const program = new Command();

// Package info (would normally come from package.json)
const version = '1.0.0';

program
  .name('lovie')
  .description('Company formation made simple - Form your US company in minutes')
  .version(version);

// Main command - start company formation
program
  .command('start', { isDefault: true })
  .description('Start a new company formation')
  .action(async () => {
    try {
      const result = await startFormationFlow();

      if (result) {
        console.log(chalk.bold.green('\n✅ Company formation initiated!\n'));
        console.log(chalk.gray('Check your Lovie dashboard to monitor the next steps (filing, documents, etc.)\n'));
        process.exit(0);
      } else {
        console.log(chalk.yellow('\nFormation cancelled.\n'));
        process.exit(0);
      }
    } catch (error) {
      console.error(chalk.red('\n❌ An error occurred:\n'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check the status of your company formation')
  .action(() => {
    console.log(chalk.cyan('Status checking not yet implemented'));
  });

// Clean command
program
  .command('clean')
  .description('Clean up old session data')
  .action(() => {
    console.log(chalk.cyan('Clean command not yet implemented'));
  });

// If no command provided, run start by default
if (!process.argv.slice(2).length) {
  program.parse([...process.argv, 'start']);
} else {
  program.parse();
}
