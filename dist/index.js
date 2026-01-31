#!/usr/bin/env node
"use strict";
/**
 * Lovie CLI - Company Formation Made Simple
 * Main entry point
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables FIRST before any other imports
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const commander_1 = require("commander");
const formationFlow_1 = require("./cli/formationFlow");
const chalk_1 = __importDefault(require("chalk"));
const program = new commander_1.Command();
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
        const result = await (0, formationFlow_1.startFormationFlow)();
        if (result) {
            console.log(chalk_1.default.bold.green('\n✅ Company formation initiated!\n'));
            console.log(chalk_1.default.gray('Check your Lovie dashboard to monitor the next steps (filing, documents, etc.)\n'));
            process.exit(0);
        }
        else {
            console.log(chalk_1.default.yellow('\nFormation cancelled.\n'));
            process.exit(0);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\n❌ An error occurred:\n'));
        if (error instanceof Error) {
            console.error(chalk_1.default.red(error.message));
        }
        process.exit(1);
    }
});
// Status command
program
    .command('status')
    .description('Check the status of your company formation')
    .action(() => {
    console.log(chalk_1.default.cyan('Status checking not yet implemented'));
});
// Clean command
program
    .command('clean')
    .description('Clean up old session data')
    .action(() => {
    console.log(chalk_1.default.cyan('Clean command not yet implemented'));
});
// If no command provided, run start by default
if (!process.argv.slice(2).length) {
    program.parse([...process.argv, 'start']);
}
else {
    program.parse();
}
//# sourceMappingURL=index.js.map