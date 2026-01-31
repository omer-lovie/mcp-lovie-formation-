/**
 * Output formatting utilities using chalk
 * User-first experience with clear, styled output
 */
import chalk from 'chalk';
export declare const colors: {
    primary: chalk.Chalk;
    success: chalk.Chalk;
    error: chalk.Chalk;
    warning: chalk.Chalk;
    info: chalk.Chalk;
    muted: chalk.Chalk;
    bold: chalk.Chalk;
    highlight: chalk.Chalk;
};
/**
 * Format a header with consistent styling
 */
export declare function formatHeader(text: string): string;
/**
 * Format a subheader
 */
export declare function formatSubheader(text: string): string;
/**
 * Format success message
 */
export declare function formatSuccess(text: string): string;
/**
 * Format error message
 */
export declare function formatError(text: string): string;
/**
 * Format warning message
 */
export declare function formatWarning(text: string): string;
/**
 * Format info message
 */
export declare function formatInfo(text: string): string;
/**
 * Format a list item
 */
export declare function formatListItem(text: string, level?: number): string;
/**
 * Format a key-value pair
 */
export declare function formatKeyValue(key: string, value: string): string;
/**
 * Format progress indicator
 * FR-011: Clear progress indication
 */
export declare function formatProgress(current: number, total: number, step: string): string;
/**
 * Format a box around text
 */
export declare function formatBox(lines: string[]): string;
/**
 * Format currency
 */
export declare function formatCurrency(amount: number): string;
/**
 * Format a summary section
 */
export declare function formatSummary(items: Array<{
    label: string;
    value: string;
}>): string;
/**
 * Clear console
 */
export declare function clearScreen(): void;
/**
 * Print with newline
 */
export declare function print(text: string): void;
/**
 * Print without newline
 */
export declare function printInline(text: string): void;
//# sourceMappingURL=formatter.d.ts.map