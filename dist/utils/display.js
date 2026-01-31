"use strict";
/**
 * Display utilities for CLI interface
 * Uses chalk for colors and ora for spinners
 * Professional design aligned with Lovie brand (AI-First Banking and Finance)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Display = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
class Display {
    /**
     * Display enhanced Lovie welcome banner
     */
    static welcome() {
        console.log();
        console.log(chalk_1.default.hex('#4A90E2')('                                                              '));
        console.log(chalk_1.default.hex('#4A90E2')('   ╔═══════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                       ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║     ') + chalk_1.default.bold.hex('#5BA3FF')('██╗     ') + chalk_1.default.bold.hex('#6CB4FF')('█████╗ ') + chalk_1.default.bold.hex('#7DC5FF')('██╗   ██╗') + chalk_1.default.bold.hex('#8ED6FF')('██╗') + chalk_1.default.bold.hex('#9FE7FF')('███████╗') + chalk_1.default.hex('#4A90E2')('     ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║     ') + chalk_1.default.bold.hex('#5BA3FF')('██║    ') + chalk_1.default.bold.hex('#6CB4FF')('██╔══██╗') + chalk_1.default.bold.hex('#7DC5FF')('██║   ██║') + chalk_1.default.bold.hex('#8ED6FF')('██║') + chalk_1.default.bold.hex('#9FE7FF')('██╔════╝') + chalk_1.default.hex('#4A90E2')('     ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║     ') + chalk_1.default.bold.hex('#5BA3FF')('██║    ') + chalk_1.default.bold.hex('#6CB4FF')('██║  ██║') + chalk_1.default.bold.hex('#7DC5FF')('██║   ██║') + chalk_1.default.bold.hex('#8ED6FF')('██║') + chalk_1.default.bold.hex('#9FE7FF')('█████╗  ') + chalk_1.default.hex('#4A90E2')('     ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║     ') + chalk_1.default.bold.hex('#5BA3FF')('██║    ') + chalk_1.default.bold.hex('#6CB4FF')('██║  ██║') + chalk_1.default.bold.hex('#7DC5FF')('╚██╗ ██╔╝') + chalk_1.default.bold.hex('#8ED6FF')('██║') + chalk_1.default.bold.hex('#9FE7FF')('██╔══╝  ') + chalk_1.default.hex('#4A90E2')('     ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║     ') + chalk_1.default.bold.hex('#5BA3FF')('███████╗') + chalk_1.default.bold.hex('#6CB4FF')('█████╔╝') + chalk_1.default.bold.hex('#7DC5FF')(' ╚████╔╝ ') + chalk_1.default.bold.hex('#8ED6FF')('██║') + chalk_1.default.bold.hex('#9FE7FF')('███████╗') + chalk_1.default.hex('#4A90E2')('     ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║     ') + chalk_1.default.bold.hex('#5BA3FF')('╚══════╝') + chalk_1.default.bold.hex('#6CB4FF')('╚════╝ ') + chalk_1.default.bold.hex('#7DC5FF')('  ╚═══╝  ') + chalk_1.default.bold.hex('#8ED6FF')('╚═╝') + chalk_1.default.bold.hex('#9FE7FF')('╚══════╝') + chalk_1.default.hex('#4A90E2')('     ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                       ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║              ') + chalk_1.default.bold.hex('#9B59B6')('AI-First Banking & Finance') + chalk_1.default.hex('#4A90E2')('              ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                       ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ╠═══════════════════════════════════════════════════════╣'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                       ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║       ') + chalk_1.default.hex('#2ECC71')('✨ ') + chalk_1.default.bold.white('Company Formation Made Simple') + chalk_1.default.hex('#2ECC71')(' ✨') + chalk_1.default.hex('#4A90E2')('        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                       ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║       ') + chalk_1.default.dim('Form your Delaware company in minutes') + chalk_1.default.hex('#4A90E2')('        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║       ') + chalk_1.default.dim('Powered by AI, trusted by founders') + chalk_1.default.hex('#4A90E2')('         ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                       ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ╚═══════════════════════════════════════════════════════╝'));
        console.log(chalk_1.default.hex('#4A90E2')('                                                              '));
        console.log();
    }
    /**
     * Display enhanced section header with box
     */
    static section(title) {
        console.log();
        console.log(chalk_1.default.hex('#9B59B6')('╔══════════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.hex('#9B59B6')('║') + chalk_1.default.bold.white(`  ${title}  `) + chalk_1.default.hex('#9B59B6')('║'));
        console.log(chalk_1.default.hex('#9B59B6')('╚══════════════════════════════════════════════════════════╝'));
        console.log();
    }
    /**
     * Display step header with professional design
     */
    static stepHeader(current, total, icon, title) {
        const percentage = Math.round((current / total) * 100);
        const progressBar = Display.createProgressBar(percentage, 30);
        console.log();
        console.log(chalk_1.default.hex('#4A90E2')('┌────────────────────────────────────────────────────────┐'));
        console.log(chalk_1.default.hex('#4A90E2')('│ ') + chalk_1.default.bold.white(`${icon}  Step ${current} of ${total}`) + chalk_1.default.gray(` (${percentage}%)`) + chalk_1.default.hex('#4A90E2')('                      │'));
        console.log(chalk_1.default.hex('#4A90E2')('│ ') + chalk_1.default.white(progressBar) + chalk_1.default.hex('#4A90E2')('                          │'));
        console.log(chalk_1.default.hex('#4A90E2')('│                                                        │'));
        console.log(chalk_1.default.hex('#4A90E2')('│ ') + chalk_1.default.bold.white(title.padEnd(54)) + chalk_1.default.hex('#4A90E2')('│'));
        console.log(chalk_1.default.hex('#4A90E2')('└────────────────────────────────────────────────────────┘'));
        console.log();
    }
    /**
     * Create a visual progress bar
     */
    static createProgressBar(percentage, width) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        return chalk_1.default.hex('#2ECC71')('█'.repeat(filled)) + chalk_1.default.gray('░'.repeat(empty));
    }
    /**
     * Display recommended option box (for partnerships/suggestions)
     */
    static recommendedBox(title, items, note) {
        const maxWidth = 56;
        console.log();
        console.log(chalk_1.default.hex('#2ECC71')('╔═══════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.hex('#2ECC71')('║ ') + chalk_1.default.bold.white('✨ ' + title.padEnd(maxWidth - 5)) + chalk_1.default.hex('#2ECC71')('║'));
        console.log(chalk_1.default.hex('#2ECC71')('╠═══════════════════════════════════════════════════════╣'));
        items.forEach(item => {
            const lines = Display.wrapText(item, maxWidth - 7);
            lines.forEach((line, idx) => {
                if (idx === 0) {
                    console.log(chalk_1.default.hex('#2ECC71')('║ ') + chalk_1.default.white('  • ') + chalk_1.default.white(line.padEnd(maxWidth - 7)) + chalk_1.default.hex('#2ECC71')(' ║'));
                }
                else {
                    console.log(chalk_1.default.hex('#2ECC71')('║ ') + chalk_1.default.white('    ') + chalk_1.default.white(line.padEnd(maxWidth - 7)) + chalk_1.default.hex('#2ECC71')(' ║'));
                }
            });
        });
        if (note) {
            console.log(chalk_1.default.hex('#2ECC71')('╠═══════════════════════════════════════════════════════╣'));
            const noteLines = Display.wrapText(note, maxWidth - 7);
            noteLines.forEach(line => {
                console.log(chalk_1.default.hex('#2ECC71')('║ ') + chalk_1.default.hex('#F39C12')('💡 ') + chalk_1.default.gray(line.padEnd(maxWidth - 7)) + chalk_1.default.hex('#2ECC71')(' ║'));
            });
        }
        console.log(chalk_1.default.hex('#2ECC71')('╚═══════════════════════════════════════════════════════╝'));
        console.log();
    }
    /**
     * Wrap text to fit within specified width
     */
    static wrapText(text, width) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach(word => {
            if ((currentLine + word).length <= width) {
                currentLine += (currentLine ? ' ' : '') + word;
            }
            else {
                if (currentLine)
                    lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine)
            lines.push(currentLine);
        return lines;
    }
    /**
     * Display info box
     */
    static infoBox(message) {
        const maxWidth = 56;
        const lines = Display.wrapText(message, maxWidth - 7);
        console.log();
        console.log(chalk_1.default.hex('#4A90E2')('┌────────────────────────────────────────────────────────┐'));
        lines.forEach(line => {
            console.log(chalk_1.default.hex('#4A90E2')('│ ') + chalk_1.default.hex('#4A90E2')('ℹ️  ') + chalk_1.default.white(line.padEnd(maxWidth - 6)) + chalk_1.default.hex('#4A90E2')('│'));
        });
        console.log(chalk_1.default.hex('#4A90E2')('└────────────────────────────────────────────────────────┘'));
        console.log();
    }
    /**
     * Display progress indicator
     */
    static progress(current, total, stepName) {
        const percentage = Math.round((current / total) * 100);
        console.log();
        console.log(chalk_1.default.gray(`Step ${current} of ${total} (${percentage}%) - ${stepName}`));
        console.log();
    }
    /**
     * Display success message with enhanced styling
     */
    static success(message) {
        console.log(chalk_1.default.hex('#2ECC71')('✓ ') + chalk_1.default.white(message));
    }
    /**
     * Display success box for important confirmations
     */
    static successBox(message, details) {
        const maxWidth = 56;
        console.log();
        console.log(chalk_1.default.hex('#2ECC71')('┌────────────────────────────────────────────────────────┐'));
        console.log(chalk_1.default.hex('#2ECC71')('│ ') + chalk_1.default.bold.hex('#2ECC71')('✓  ') + chalk_1.default.bold.white(message.padEnd(maxWidth - 6)) + chalk_1.default.hex('#2ECC71')('│'));
        if (details && details.length > 0) {
            console.log(chalk_1.default.hex('#2ECC71')('├────────────────────────────────────────────────────────┤'));
            details.forEach(detail => {
                const lines = Display.wrapText(detail, maxWidth - 7);
                lines.forEach(line => {
                    console.log(chalk_1.default.hex('#2ECC71')('│ ') + chalk_1.default.gray('   ' + line.padEnd(maxWidth - 6)) + chalk_1.default.hex('#2ECC71')('│'));
                });
            });
        }
        console.log(chalk_1.default.hex('#2ECC71')('└────────────────────────────────────────────────────────┘'));
        console.log();
    }
    /**
     * Display error message with enhanced styling
     */
    static error(message) {
        console.log(chalk_1.default.hex('#E74C3C')('✗ ') + chalk_1.default.white(message));
    }
    /**
     * Display error box for critical errors
     */
    static errorBox(message, details) {
        const maxWidth = 56;
        console.log();
        console.log(chalk_1.default.hex('#E74C3C')('┌────────────────────────────────────────────────────────┐'));
        console.log(chalk_1.default.hex('#E74C3C')('│ ') + chalk_1.default.bold.hex('#E74C3C')('✗  ') + chalk_1.default.bold.white(message.padEnd(maxWidth - 6)) + chalk_1.default.hex('#E74C3C')('│'));
        if (details && details.length > 0) {
            console.log(chalk_1.default.hex('#E74C3C')('├────────────────────────────────────────────────────────┤'));
            details.forEach(detail => {
                const lines = Display.wrapText(detail, maxWidth - 7);
                lines.forEach(line => {
                    console.log(chalk_1.default.hex('#E74C3C')('│ ') + chalk_1.default.gray('   ' + line.padEnd(maxWidth - 6)) + chalk_1.default.hex('#E74C3C')('│'));
                });
            });
        }
        console.log(chalk_1.default.hex('#E74C3C')('└────────────────────────────────────────────────────────┘'));
        console.log();
    }
    /**
     * Display warning message with enhanced styling
     */
    static warning(message) {
        console.log(chalk_1.default.hex('#F39C12')('⚠ ') + chalk_1.default.white(message));
    }
    /**
     * Display info message with enhanced styling
     */
    static info(message) {
        console.log(chalk_1.default.hex('#4A90E2')('ℹ ') + chalk_1.default.white(message));
    }
    /**
     * Display enhanced company summary with professional layout
     */
    static companySummary(company) {
        const maxWidth = 56;
        console.log();
        console.log(chalk_1.default.hex('#4A90E2')('╔════════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.bold.white('Company Information'.padEnd(maxWidth)) + chalk_1.default.hex('#4A90E2')('║'));
        console.log(chalk_1.default.hex('#4A90E2')('╠════════════════════════════════════════════════════════╣'));
        if (company.name) {
            console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.hex('#9B59B6')('Company Name:    ') + chalk_1.default.white(company.name.padEnd(maxWidth - 17)) + chalk_1.default.hex('#4A90E2')('║'));
        }
        if (company.type) {
            const typeLabel = company.type === 'LLC' ? 'LLC' :
                company.type === 'C-Corp' ? 'C Corporation' :
                    'S Corporation';
            console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.hex('#9B59B6')('Company Type:    ') + chalk_1.default.white(typeLabel.padEnd(maxWidth - 17)) + chalk_1.default.hex('#4A90E2')('║'));
        }
        if (company.state) {
            console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.hex('#9B59B6')('State:           ') + chalk_1.default.white(company.state.padEnd(maxWidth - 17)) + chalk_1.default.hex('#4A90E2')('║'));
        }
        if (company.shareholders && company.shareholders.length > 0) {
            console.log(chalk_1.default.hex('#4A90E2')('╠════════════════════════════════════════════════════════╣'));
            console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.bold.white('Shareholders/Members'.padEnd(maxWidth)) + chalk_1.default.hex('#4A90E2')('║'));
            console.log(chalk_1.default.hex('#4A90E2')('╟────────────────────────────────────────────────────────╢'));
            company.shareholders.forEach((sh, idx) => {
                const fullName = `${sh.firstName} ${sh.lastName}`;
                console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.gray(`${idx + 1}. `) + chalk_1.default.white(fullName) + chalk_1.default.hex('#2ECC71')(` (${sh.ownershipPercentage}%)`.padEnd(maxWidth - fullName.length - 3)) + chalk_1.default.hex('#4A90E2')('║'));
                console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.dim(`   ${sh.email}`.padEnd(maxWidth)) + chalk_1.default.hex('#4A90E2')('║'));
            });
        }
        if (company.registeredAgent) {
            console.log(chalk_1.default.hex('#4A90E2')('╠════════════════════════════════════════════════════════╣'));
            console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.bold.white('Registered Agent'.padEnd(maxWidth)) + chalk_1.default.hex('#4A90E2')('║'));
            console.log(chalk_1.default.hex('#4A90E2')('╟────────────────────────────────────────────────────────╢'));
            console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.hex('#9B59B6')('Name:     ') + chalk_1.default.white(company.registeredAgent.name.padEnd(maxWidth - 10)) + chalk_1.default.hex('#4A90E2')('║'));
            const addressLine = `${company.registeredAgent.address.street1}, ${company.registeredAgent.address.city}, ${company.registeredAgent.address.state} ${company.registeredAgent.address.zipCode}`;
            console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.hex('#9B59B6')('Address:  ') + chalk_1.default.white(addressLine.padEnd(maxWidth - 10)) + chalk_1.default.hex('#4A90E2')('║'));
            console.log(chalk_1.default.hex('#4A90E2')('║ ') + chalk_1.default.hex('#9B59B6')('Phone:    ') + chalk_1.default.white((company.registeredAgent.phone || '').padEnd(maxWidth - 10)) + chalk_1.default.hex('#4A90E2')('║'));
        }
        console.log(chalk_1.default.hex('#4A90E2')('╚════════════════════════════════════════════════════════╝'));
        console.log();
    }
    /**
     * Display payment details
     */
    static paymentDetails(details) {
        console.log();
        console.log(chalk_1.default.bold.white('Payment Summary:'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('State Filing Fee:  ') + chalk_1.default.white(`$${details.filingFee.toFixed(2)}`));
        console.log(chalk_1.default.cyan('Service Fee:       ') + chalk_1.default.white(`$${details.serviceFee.toFixed(2)}`));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.bold.cyan('Total:             ') + chalk_1.default.bold.white(`$${details.total.toFixed(2)}`));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log();
    }
    /**
     * Display filing confirmation
     */
    static filingConfirmation(result) {
        console.log();
        console.log(chalk_1.default.bold.green('🎉 Success! Your company has been filed!'));
        console.log();
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('Filing Number:        ') + chalk_1.default.white(result.filingNumber));
        console.log(chalk_1.default.cyan('Confirmation Number:  ') + chalk_1.default.white(result.confirmationNumber));
        console.log(chalk_1.default.cyan('Filing Date:          ') + chalk_1.default.white(result.filingDate.toLocaleDateString()));
        console.log(chalk_1.default.cyan('Status:               ') + chalk_1.default.white(result.status.toUpperCase()));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log();
    }
    /**
     * Display next steps
     */
    static nextSteps() {
        console.log(chalk_1.default.bold.white('What\'s Next?'));
        console.log();
        console.log(chalk_1.default.white('1. ') + chalk_1.default.gray('Check your email for confirmation and documents'));
        console.log(chalk_1.default.white('2. ') + chalk_1.default.gray('Apply for an EIN (Employer Identification Number) with the IRS'));
        console.log(chalk_1.default.white('3. ') + chalk_1.default.gray('Set up a business bank account'));
        console.log(chalk_1.default.white('4. ') + chalk_1.default.gray('File for any necessary business licenses'));
        console.log(chalk_1.default.white('5. ') + chalk_1.default.gray('Keep up with annual compliance requirements'));
        console.log();
    }
    /**
     * Create a spinner for loading operations
     */
    static spinner(text) {
        return (0, ora_1.default)({
            text: chalk_1.default.white(text),
            color: 'cyan',
            spinner: 'dots'
        }).start();
    }
    /**
     * Display a blank line
     */
    static blank() {
        console.log();
    }
    /**
     * Clear the console
     */
    static clear() {
        console.clear();
    }
    /**
     * Display help text
     */
    static helpText(text) {
        console.log(chalk_1.default.gray(`  💡 ${text}`));
    }
    /**
     * Display update notification
     */
    static updateAvailable(currentVersion, latestVersion) {
        console.log();
        console.log(chalk_1.default.yellow('┌─────────────────────────────────────────────┐'));
        console.log(chalk_1.default.yellow('│                                             │'));
        console.log(chalk_1.default.yellow('│  ') + chalk_1.default.white('Update available: ') +
            chalk_1.default.gray(currentVersion) + chalk_1.default.white(' → ') +
            chalk_1.default.green(latestVersion) + chalk_1.default.yellow('  │'));
        console.log(chalk_1.default.yellow('│                                             │'));
        console.log(chalk_1.default.yellow('│  ') + chalk_1.default.white('Run: ') +
            chalk_1.default.cyan('npm update -g lovie') + chalk_1.default.yellow('              │'));
        console.log(chalk_1.default.yellow('│                                             │'));
        console.log(chalk_1.default.yellow('└─────────────────────────────────────────────┘'));
        console.log();
    }
    /**
     * Display connection error
     */
    static connectionError() {
        console.log();
        console.log(chalk_1.default.red('✗ ') + chalk_1.default.white('Connection error'));
        console.log(chalk_1.default.gray('  Please check your internet connection and try again.'));
        console.log();
    }
    /**
     * Display support info
     */
    static supportInfo() {
        console.log();
        console.log(chalk_1.default.bold.white('Need help?'));
        console.log(chalk_1.default.gray('  Email: ') + chalk_1.default.cyan('support@lovie.io'));
        console.log(chalk_1.default.gray('  Web:   ') + chalk_1.default.cyan('https://lovie.io/support'));
        console.log();
    }
}
exports.Display = Display;
// Brand colors
Display.BRAND_PRIMARY = '#4A90E2'; // Professional blue
Display.BRAND_SUCCESS = '#2ECC71'; // Success green
Display.BRAND_WARNING = '#F39C12'; // Warning orange
Display.BRAND_ERROR = '#E74C3C'; // Error red
Display.BRAND_ACCENT = '#9B59B6'; // Accent purple
//# sourceMappingURL=display.js.map