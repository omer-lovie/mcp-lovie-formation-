/**
 * Display utilities for CLI interface
 * Uses chalk for colors and ora for spinners
 * Professional design aligned with Lovie brand (AI-First Banking and Finance)
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { Company, PaymentDetails, FilingResult } from '../types';

export class Display {
  // Brand colors
  private static readonly BRAND_PRIMARY = '#4A90E2';    // Professional blue
  private static readonly BRAND_SUCCESS = '#2ECC71';    // Success green
  private static readonly BRAND_WARNING = '#F39C12';    // Warning orange
  private static readonly BRAND_ERROR = '#E74C3C';      // Error red
  private static readonly BRAND_ACCENT = '#9B59B6';     // Accent purple

  /**
   * Display enhanced Lovie welcome banner
   */
  static welcome(): void {
    console.log();
    console.log(chalk.hex('#4A90E2')('                                                              '));
    console.log(chalk.hex('#4A90E2')('   ╔═══════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('██╗     ') + chalk.bold.hex('#6CB4FF')('█████╗ ') + chalk.bold.hex('#7DC5FF')('██╗   ██╗') + chalk.bold.hex('#8ED6FF')('██╗') + chalk.bold.hex('#9FE7FF')('███████╗') + chalk.hex('#4A90E2')('     ║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('██║    ') + chalk.bold.hex('#6CB4FF')('██╔══██╗') + chalk.bold.hex('#7DC5FF')('██║   ██║') + chalk.bold.hex('#8ED6FF')('██║') + chalk.bold.hex('#9FE7FF')('██╔════╝') + chalk.hex('#4A90E2')('     ║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('██║    ') + chalk.bold.hex('#6CB4FF')('██║  ██║') + chalk.bold.hex('#7DC5FF')('██║   ██║') + chalk.bold.hex('#8ED6FF')('██║') + chalk.bold.hex('#9FE7FF')('█████╗  ') + chalk.hex('#4A90E2')('     ║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('██║    ') + chalk.bold.hex('#6CB4FF')('██║  ██║') + chalk.bold.hex('#7DC5FF')('╚██╗ ██╔╝') + chalk.bold.hex('#8ED6FF')('██║') + chalk.bold.hex('#9FE7FF')('██╔══╝  ') + chalk.hex('#4A90E2')('     ║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('███████╗') + chalk.bold.hex('#6CB4FF')('█████╔╝') + chalk.bold.hex('#7DC5FF')(' ╚████╔╝ ') + chalk.bold.hex('#8ED6FF')('██║') + chalk.bold.hex('#9FE7FF')('███████╗') + chalk.hex('#4A90E2')('     ║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('╚══════╝') + chalk.bold.hex('#6CB4FF')('╚════╝ ') + chalk.bold.hex('#7DC5FF')('  ╚═══╝  ') + chalk.bold.hex('#8ED6FF')('╚═╝') + chalk.bold.hex('#9FE7FF')('╚══════╝') + chalk.hex('#4A90E2')('     ║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
    console.log(chalk.hex('#4A90E2')('   ║              ') + chalk.bold.hex('#9B59B6')('AI-First Banking & Finance') + chalk.hex('#4A90E2')('              ║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
    console.log(chalk.hex('#4A90E2')('   ╠═══════════════════════════════════════════════════════╣'));
    console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
    console.log(chalk.hex('#4A90E2')('   ║       ') + chalk.hex('#2ECC71')('✨ ') + chalk.bold.white('Company Formation Made Simple') + chalk.hex('#2ECC71')(' ✨') + chalk.hex('#4A90E2')('        ║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
    console.log(chalk.hex('#4A90E2')('   ║       ') + chalk.dim('Form your Delaware company in minutes') + chalk.hex('#4A90E2')('        ║'));
    console.log(chalk.hex('#4A90E2')('   ║       ') + chalk.dim('Powered by AI, trusted by founders') + chalk.hex('#4A90E2')('         ║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
    console.log(chalk.hex('#4A90E2')('   ╚═══════════════════════════════════════════════════════╝'));
    console.log(chalk.hex('#4A90E2')('                                                              '));
    console.log();
  }

  /**
   * Display enhanced section header with box
   */
  static section(title: string): void {
    console.log();
    console.log(chalk.hex('#9B59B6')('╔══════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#9B59B6')('║') + chalk.bold.white(`  ${title}  `) + chalk.hex('#9B59B6')('║'));
    console.log(chalk.hex('#9B59B6')('╚══════════════════════════════════════════════════════════╝'));
    console.log();
  }

  /**
   * Display step header with professional design
   */
  static stepHeader(current: number, total: number, icon: string, title: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = Display.createProgressBar(percentage, 30);

    console.log();
    console.log(chalk.hex('#4A90E2')('┌────────────────────────────────────────────────────────┐'));
    console.log(chalk.hex('#4A90E2')('│ ') + chalk.bold.white(`${icon}  Step ${current} of ${total}`) + chalk.gray(` (${percentage}%)`) + chalk.hex('#4A90E2')('                      │'));
    console.log(chalk.hex('#4A90E2')('│ ') + chalk.white(progressBar) + chalk.hex('#4A90E2')('                          │'));
    console.log(chalk.hex('#4A90E2')('│                                                        │'));
    console.log(chalk.hex('#4A90E2')('│ ') + chalk.bold.white(title.padEnd(54)) + chalk.hex('#4A90E2')('│'));
    console.log(chalk.hex('#4A90E2')('└────────────────────────────────────────────────────────┘'));
    console.log();
  }

  /**
   * Create a visual progress bar
   */
  private static createProgressBar(percentage: number, width: number): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return chalk.hex('#2ECC71')('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  /**
   * Display recommended option box (for partnerships/suggestions)
   */
  static recommendedBox(title: string, items: string[], note?: string): void {
    const maxWidth = 56;
    console.log();
    console.log(chalk.hex('#2ECC71')('╔═══════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#2ECC71')('║ ') + chalk.bold.white('✨ ' + title.padEnd(maxWidth - 5)) + chalk.hex('#2ECC71')('║'));
    console.log(chalk.hex('#2ECC71')('╠═══════════════════════════════════════════════════════╣'));

    items.forEach(item => {
      const lines = Display.wrapText(item, maxWidth - 7);
      lines.forEach((line, idx) => {
        if (idx === 0) {
          console.log(chalk.hex('#2ECC71')('║ ') + chalk.white('  • ') + chalk.white(line.padEnd(maxWidth - 7)) + chalk.hex('#2ECC71')(' ║'));
        } else {
          console.log(chalk.hex('#2ECC71')('║ ') + chalk.white('    ') + chalk.white(line.padEnd(maxWidth - 7)) + chalk.hex('#2ECC71')(' ║'));
        }
      });
    });

    if (note) {
      console.log(chalk.hex('#2ECC71')('╠═══════════════════════════════════════════════════════╣'));
      const noteLines = Display.wrapText(note, maxWidth - 7);
      noteLines.forEach(line => {
        console.log(chalk.hex('#2ECC71')('║ ') + chalk.hex('#F39C12')('💡 ') + chalk.gray(line.padEnd(maxWidth - 7)) + chalk.hex('#2ECC71')(' ║'));
      });
    }

    console.log(chalk.hex('#2ECC71')('╚═══════════════════════════════════════════════════════╝'));
    console.log();
  }

  /**
   * Wrap text to fit within specified width
   */
  private static wrapText(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Display info box
   */
  static infoBox(message: string): void {
    const maxWidth = 56;
    const lines = Display.wrapText(message, maxWidth - 7);

    console.log();
    console.log(chalk.hex('#4A90E2')('┌────────────────────────────────────────────────────────┐'));
    lines.forEach(line => {
      console.log(chalk.hex('#4A90E2')('│ ') + chalk.hex('#4A90E2')('ℹ️  ') + chalk.white(line.padEnd(maxWidth - 6)) + chalk.hex('#4A90E2')('│'));
    });
    console.log(chalk.hex('#4A90E2')('└────────────────────────────────────────────────────────┘'));
    console.log();
  }

  /**
   * Display progress indicator
   */
  static progress(current: number, total: number, stepName: string): void {
    const percentage = Math.round((current / total) * 100);
    console.log();
    console.log(chalk.gray(`Step ${current} of ${total} (${percentage}%) - ${stepName}`));
    console.log();
  }

  /**
   * Display success message with enhanced styling
   */
  static success(message: string): void {
    console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white(message));
  }

  /**
   * Display success box for important confirmations
   */
  static successBox(message: string, details?: string[]): void {
    const maxWidth = 56;
    console.log();
    console.log(chalk.hex('#2ECC71')('┌────────────────────────────────────────────────────────┐'));
    console.log(chalk.hex('#2ECC71')('│ ') + chalk.bold.hex('#2ECC71')('✓  ') + chalk.bold.white(message.padEnd(maxWidth - 6)) + chalk.hex('#2ECC71')('│'));

    if (details && details.length > 0) {
      console.log(chalk.hex('#2ECC71')('├────────────────────────────────────────────────────────┤'));
      details.forEach(detail => {
        const lines = Display.wrapText(detail, maxWidth - 7);
        lines.forEach(line => {
          console.log(chalk.hex('#2ECC71')('│ ') + chalk.gray('   ' + line.padEnd(maxWidth - 6)) + chalk.hex('#2ECC71')('│'));
        });
      });
    }

    console.log(chalk.hex('#2ECC71')('└────────────────────────────────────────────────────────┘'));
    console.log();
  }

  /**
   * Display error message with enhanced styling
   */
  static error(message: string): void {
    console.log(chalk.hex('#E74C3C')('✗ ') + chalk.white(message));
  }

  /**
   * Display error box for critical errors
   */
  static errorBox(message: string, details?: string[]): void {
    const maxWidth = 56;
    console.log();
    console.log(chalk.hex('#E74C3C')('┌────────────────────────────────────────────────────────┐'));
    console.log(chalk.hex('#E74C3C')('│ ') + chalk.bold.hex('#E74C3C')('✗  ') + chalk.bold.white(message.padEnd(maxWidth - 6)) + chalk.hex('#E74C3C')('│'));

    if (details && details.length > 0) {
      console.log(chalk.hex('#E74C3C')('├────────────────────────────────────────────────────────┤'));
      details.forEach(detail => {
        const lines = Display.wrapText(detail, maxWidth - 7);
        lines.forEach(line => {
          console.log(chalk.hex('#E74C3C')('│ ') + chalk.gray('   ' + line.padEnd(maxWidth - 6)) + chalk.hex('#E74C3C')('│'));
        });
      });
    }

    console.log(chalk.hex('#E74C3C')('└────────────────────────────────────────────────────────┘'));
    console.log();
  }

  /**
   * Display warning message with enhanced styling
   */
  static warning(message: string): void {
    console.log(chalk.hex('#F39C12')('⚠ ') + chalk.white(message));
  }

  /**
   * Display info message with enhanced styling
   */
  static info(message: string): void {
    console.log(chalk.hex('#4A90E2')('ℹ ') + chalk.white(message));
  }

  /**
   * Display enhanced company summary with professional layout
   */
  static companySummary(company: Partial<Company>): void {
    const maxWidth = 56;
    console.log();
    console.log(chalk.hex('#4A90E2')('╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#4A90E2')('║ ') + chalk.bold.white('Company Information'.padEnd(maxWidth)) + chalk.hex('#4A90E2')('║'));
    console.log(chalk.hex('#4A90E2')('╠════════════════════════════════════════════════════════╣'));

    if (company.name) {
      console.log(chalk.hex('#4A90E2')('║ ') + chalk.hex('#9B59B6')('Company Name:    ') + chalk.white(company.name.padEnd(maxWidth - 17)) + chalk.hex('#4A90E2')('║'));
    }
    if (company.type) {
      const typeLabel = company.type === 'LLC' ? 'LLC' :
                       company.type === 'C-Corp' ? 'C Corporation' :
                       'S Corporation';
      console.log(chalk.hex('#4A90E2')('║ ') + chalk.hex('#9B59B6')('Company Type:    ') + chalk.white(typeLabel.padEnd(maxWidth - 17)) + chalk.hex('#4A90E2')('║'));
    }
    if (company.state) {
      console.log(chalk.hex('#4A90E2')('║ ') + chalk.hex('#9B59B6')('State:           ') + chalk.white(company.state.padEnd(maxWidth - 17)) + chalk.hex('#4A90E2')('║'));
    }

    if (company.shareholders && company.shareholders.length > 0) {
      console.log(chalk.hex('#4A90E2')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#4A90E2')('║ ') + chalk.bold.white('Shareholders/Members'.padEnd(maxWidth)) + chalk.hex('#4A90E2')('║'));
      console.log(chalk.hex('#4A90E2')('╟────────────────────────────────────────────────────────╢'));
      company.shareholders.forEach((sh, idx) => {
        const fullName = `${sh.firstName} ${sh.lastName}`;
        console.log(chalk.hex('#4A90E2')('║ ') + chalk.gray(`${idx + 1}. `) + chalk.white(fullName) + chalk.hex('#2ECC71')(` (${sh.ownershipPercentage}%)`.padEnd(maxWidth - fullName.length - 3)) + chalk.hex('#4A90E2')('║'));
        console.log(chalk.hex('#4A90E2')('║ ') + chalk.dim(`   ${sh.email}`.padEnd(maxWidth)) + chalk.hex('#4A90E2')('║'));
      });
    }

    if (company.registeredAgent) {
      console.log(chalk.hex('#4A90E2')('╠════════════════════════════════════════════════════════╣'));
      console.log(chalk.hex('#4A90E2')('║ ') + chalk.bold.white('Registered Agent'.padEnd(maxWidth)) + chalk.hex('#4A90E2')('║'));
      console.log(chalk.hex('#4A90E2')('╟────────────────────────────────────────────────────────╢'));
      console.log(chalk.hex('#4A90E2')('║ ') + chalk.hex('#9B59B6')('Name:     ') + chalk.white(company.registeredAgent.name.padEnd(maxWidth - 10)) + chalk.hex('#4A90E2')('║'));
      const addressLine = `${company.registeredAgent.address.street1}, ${company.registeredAgent.address.city}, ${company.registeredAgent.address.state} ${company.registeredAgent.address.zipCode}`;
      console.log(chalk.hex('#4A90E2')('║ ') + chalk.hex('#9B59B6')('Address:  ') + chalk.white(addressLine.padEnd(maxWidth - 10)) + chalk.hex('#4A90E2')('║'));
      console.log(chalk.hex('#4A90E2')('║ ') + chalk.hex('#9B59B6')('Phone:    ') + chalk.white((company.registeredAgent.phone || '').padEnd(maxWidth - 10)) + chalk.hex('#4A90E2')('║'));
    }

    console.log(chalk.hex('#4A90E2')('╚════════════════════════════════════════════════════════╝'));
    console.log();
  }

  /**
   * Display payment details
   */
  static paymentDetails(details: PaymentDetails): void {
    console.log();
    console.log(chalk.bold.white('Payment Summary:'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('State Filing Fee:  ') + chalk.white(`$${details.filingFee.toFixed(2)}`));
    console.log(chalk.cyan('Service Fee:       ') + chalk.white(`$${details.serviceFee.toFixed(2)}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold.cyan('Total:             ') + chalk.bold.white(`$${details.total.toFixed(2)}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
  }

  /**
   * Display filing confirmation
   */
  static filingConfirmation(result: FilingResult): void {
    console.log();
    console.log(chalk.bold.green('🎉 Success! Your company has been filed!'));
    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('Filing Number:        ') + chalk.white(result.filingNumber));
    console.log(chalk.cyan('Confirmation Number:  ') + chalk.white(result.confirmationNumber));
    console.log(chalk.cyan('Filing Date:          ') + chalk.white(result.filingDate.toLocaleDateString()));
    console.log(chalk.cyan('Status:               ') + chalk.white(result.status.toUpperCase()));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
  }

  /**
   * Display next steps
   */
  static nextSteps(): void {
    console.log(chalk.bold.white('What\'s Next?'));
    console.log();
    console.log(chalk.white('1. ') + chalk.gray('Check your email for confirmation and documents'));
    console.log(chalk.white('2. ') + chalk.gray('Apply for an EIN (Employer Identification Number) with the IRS'));
    console.log(chalk.white('3. ') + chalk.gray('Set up a business bank account'));
    console.log(chalk.white('4. ') + chalk.gray('File for any necessary business licenses'));
    console.log(chalk.white('5. ') + chalk.gray('Keep up with annual compliance requirements'));
    console.log();
  }

  /**
   * Create a spinner for loading operations
   */
  static spinner(text: string): Ora {
    return ora({
      text: chalk.white(text),
      color: 'cyan',
      spinner: 'dots'
    }).start();
  }

  /**
   * Display a blank line
   */
  static blank(): void {
    console.log();
  }

  /**
   * Clear the console
   */
  static clear(): void {
    console.clear();
  }

  /**
   * Display help text
   */
  static helpText(text: string): void {
    console.log(chalk.gray(`  💡 ${text}`));
  }

  /**
   * Display update notification
   */
  static updateAvailable(currentVersion: string, latestVersion: string): void {
    console.log();
    console.log(chalk.yellow('┌─────────────────────────────────────────────┐'));
    console.log(chalk.yellow('│                                             │'));
    console.log(chalk.yellow('│  ') + chalk.white('Update available: ') +
               chalk.gray(currentVersion) + chalk.white(' → ') +
               chalk.green(latestVersion) + chalk.yellow('  │'));
    console.log(chalk.yellow('│                                             │'));
    console.log(chalk.yellow('│  ') + chalk.white('Run: ') +
               chalk.cyan('npm update -g lovie') + chalk.yellow('              │'));
    console.log(chalk.yellow('│                                             │'));
    console.log(chalk.yellow('└─────────────────────────────────────────────┘'));
    console.log();
  }

  /**
   * Display connection error
   */
  static connectionError(): void {
    console.log();
    console.log(chalk.red('✗ ') + chalk.white('Connection error'));
    console.log(chalk.gray('  Please check your internet connection and try again.'));
    console.log();
  }

  /**
   * Display support info
   */
  static supportInfo(): void {
    console.log();
    console.log(chalk.bold.white('Need help?'));
    console.log(chalk.gray('  Email: ') + chalk.cyan('support@lovie.io'));
    console.log(chalk.gray('  Web:   ') + chalk.cyan('https://lovie.io/support'));
    console.log();
  }
}
