/**
 * Help command
 * FR-003: Provide --help command
 * FR-007: Plain language, no jargon
 */

import { colors, formatHeader, formatListItem, print } from '../utils/formatter';

/**
 * Display help information
 */
export function showHelp(): void {
  print(formatHeader('Lovie CLI - Company Formation Tool'));

  print(colors.bold('\nUsage:'));
  print('  lovie [command] [options]\n');

  print(colors.bold('Commands:'));
  print(formatListItem('lovie, lovie start    Start company formation process'));
  print(formatListItem('lovie --version       Show version information'));
  print(formatListItem('lovie --help          Show this help message'));

  print(colors.bold('\nDescription:'));
  print('  Lovie helps you form your US company in minutes through an interactive,');
  print('  user-friendly command-line interface. We support LLC, C-Corp, and S-Corp');
  print('  formations in all 50 US states.');

  print(colors.bold('\nExamples:'));
  print(formatListItem('lovie                 # Start the formation process', 1));
  print(formatListItem('lovie start           # Same as above', 1));
  print(formatListItem('lovie --version       # Check your current version', 1));

  print(colors.bold('\nFeatures:'));
  print(formatListItem('✓ Conversational, step-by-step guidance'));
  print(formatListItem('✓ Real-time company name availability checking'));
  print(formatListItem('✓ Support for all 50 US states'));
  print(formatListItem('✓ LLC, C-Corp, and S-Corp formations'));
  print(formatListItem('✓ Resume interrupted sessions'));
  print(formatListItem('✓ Secure payment processing'));
  print(formatListItem('✓ Automatic document generation and filing'));

  print(colors.bold('\nSupport:'));
  print('  Website: https://lovie.app');
  print('  Email: support@lovie.app');
  print('  GitHub: https://github.com/lovie-app/cli\n');
}
