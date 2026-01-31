"use strict";
/**
 * Help command
 * FR-003: Provide --help command
 * FR-007: Plain language, no jargon
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.showHelp = showHelp;
const formatter_1 = require("../utils/formatter");
/**
 * Display help information
 */
function showHelp() {
    (0, formatter_1.print)((0, formatter_1.formatHeader)('Lovie CLI - Company Formation Tool'));
    (0, formatter_1.print)(formatter_1.colors.bold('\nUsage:'));
    (0, formatter_1.print)('  lovie [command] [options]\n');
    (0, formatter_1.print)(formatter_1.colors.bold('Commands:'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('lovie, lovie start    Start company formation process'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('lovie --version       Show version information'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('lovie --help          Show this help message'));
    (0, formatter_1.print)(formatter_1.colors.bold('\nDescription:'));
    (0, formatter_1.print)('  Lovie helps you form your US company in minutes through an interactive,');
    (0, formatter_1.print)('  user-friendly command-line interface. We support LLC, C-Corp, and S-Corp');
    (0, formatter_1.print)('  formations in all 50 US states.');
    (0, formatter_1.print)(formatter_1.colors.bold('\nExamples:'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('lovie                 # Start the formation process', 1));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('lovie start           # Same as above', 1));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('lovie --version       # Check your current version', 1));
    (0, formatter_1.print)(formatter_1.colors.bold('\nFeatures:'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('✓ Conversational, step-by-step guidance'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('✓ Real-time company name availability checking'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('✓ Support for all 50 US states'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('✓ LLC, C-Corp, and S-Corp formations'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('✓ Resume interrupted sessions'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('✓ Secure payment processing'));
    (0, formatter_1.print)((0, formatter_1.formatListItem)('✓ Automatic document generation and filing'));
    (0, formatter_1.print)(formatter_1.colors.bold('\nSupport:'));
    (0, formatter_1.print)('  Website: https://lovie.app');
    (0, formatter_1.print)('  Email: support@lovie.app');
    (0, formatter_1.print)('  GitHub: https://github.com/lovie-app/cli\n');
}
//# sourceMappingURL=help.js.map