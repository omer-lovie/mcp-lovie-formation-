/**
 * Version command
 * FR-003: Provide --version command
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { colors, print } from '../utils/formatter';

/**
 * Display version information
 */
export function showVersion(): void {
  try {
    // Read version from package.json
    const packageJsonPath = join(__dirname, '../../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    print(colors.primary.bold('Lovie CLI'));
    print(colors.muted(`Version ${packageJson.version}`));
    print(colors.muted('Company formation made simple.'));
  } catch (error) {
    print(colors.error('Unable to determine version'));
  }
}
