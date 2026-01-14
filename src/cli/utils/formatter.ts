/**
 * Output formatting utilities using chalk
 * User-first experience with clear, styled output
 */

import chalk from 'chalk';

export const colors = {
  primary: chalk.cyan,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  muted: chalk.gray,
  bold: chalk.bold,
  highlight: chalk.cyan.bold,
};

/**
 * Format a header with consistent styling
 */
export function formatHeader(text: string): string {
  return `\n${colors.primary.bold('━'.repeat(50))}\n${colors.highlight(text)}\n${colors.primary.bold('━'.repeat(50))}\n`;
}

/**
 * Format a subheader
 */
export function formatSubheader(text: string): string {
  return `\n${colors.primary(text)}\n`;
}

/**
 * Format success message
 */
export function formatSuccess(text: string): string {
  return colors.success(`✓ ${text}`);
}

/**
 * Format error message
 */
export function formatError(text: string): string {
  return colors.error(`✗ ${text}`);
}

/**
 * Format warning message
 */
export function formatWarning(text: string): string {
  return colors.warning(`⚠ ${text}`);
}

/**
 * Format info message
 */
export function formatInfo(text: string): string {
  return colors.info(`ℹ ${text}`);
}

/**
 * Format a list item
 */
export function formatListItem(text: string, level: number = 0): string {
  const indent = '  '.repeat(level);
  return `${indent}${colors.muted('•')} ${text}`;
}

/**
 * Format a key-value pair
 */
export function formatKeyValue(key: string, value: string): string {
  return `${colors.bold(key)}: ${value}`;
}

/**
 * Format progress indicator
 * FR-011: Clear progress indication
 */
export function formatProgress(current: number, total: number, step: string): string {
  return colors.muted(`[Step ${current}/${total}] `) + step;
}

/**
 * Format a box around text
 */
export function formatBox(lines: string[]): string {
  const maxLength = Math.max(...lines.map(line => line.length));
  const horizontalBorder = colors.primary('─'.repeat(maxLength + 4));

  const formattedLines = lines.map(line => {
    const padding = ' '.repeat(maxLength - line.length);
    return colors.primary('│ ') + line + padding + colors.primary(' │');
  });

  return [
    colors.primary('┌' + horizontalBorder.replace(/─/g, '─') + '┐'),
    ...formattedLines,
    colors.primary('└' + horizontalBorder.replace(/─/g, '─') + '┘')
  ].join('\n');
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format a summary section
 */
export function formatSummary(items: Array<{ label: string; value: string }>): string {
  const lines = items.map(item =>
    `${colors.muted(item.label.padEnd(25))}: ${colors.bold(item.value)}`
  );
  return lines.join('\n');
}

/**
 * Clear console
 */
export function clearScreen(): void {
  console.clear();
}

/**
 * Print with newline
 */
export function print(text: string): void {
  console.log(text);
}

/**
 * Print without newline
 */
export function printInline(text: string): void {
  process.stdout.write(text);
}
