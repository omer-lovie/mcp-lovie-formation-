"use strict";
/**
 * Main CLI entry point
 * Implements Commander.js for command routing
 * FR-003: Version and help commands
 * FR-004: Update checking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
exports.main = main;
const commander_1 = require("commander");
const commands_1 = require("./cli/commands");
const formatter_1 = require("./cli/utils/formatter");
const fs_1 = require("fs");
const path_1 = require("path");
// Read package.json for version info
const packageJson = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../package.json'), 'utf-8'));
const program = new commander_1.Command();
exports.program = program;
// Configure CLI metadata
program
    .name('lovie')
    .description('Company formation made simple - Form your US company in minutes')
    .version(packageJson.version, '-v, --version', 'Display version information')
    .helpOption('-h, --help', 'Display help information');
// Default command (no arguments) - start formation
program
    .action(() => {
    (0, commands_1.startFormation)();
});
// Start command (explicit)
program
    .command('start')
    .description('Start the company formation process')
    .action(() => {
    (0, commands_1.startFormation)();
});
// Check for updates on startup
// FR-004: Check for updates and notify users
async function checkForUpdates() {
    try {
        // In production, this would check npm registry or a custom API
        // For now, we'll skip the actual check
        const hasUpdate = false; // Simulated
        if (hasUpdate) {
            (0, formatter_1.print)((0, formatter_1.formatWarning)('\n⚠️  A new version of Lovie is available!'));
            (0, formatter_1.print)((0, formatter_1.formatWarning)('Run "npm update -g lovie" to upgrade.\n'));
        }
    }
    catch (error) {
        // Silently fail - don't interrupt user experience
    }
}
/**
 * Main CLI entry point
 */
async function main(argv) {
    // Check for updates in the background
    checkForUpdates();
    // Handle custom help
    if (argv.includes('--help') || argv.includes('-h')) {
        (0, commands_1.showHelp)();
        return;
    }
    // Handle custom version
    if (argv.includes('--version') || argv.includes('-v')) {
        (0, commands_1.showVersion)();
        return;
    }
    // Parse commands
    try {
        await program.parseAsync(argv);
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
//# sourceMappingURL=cli.js.map