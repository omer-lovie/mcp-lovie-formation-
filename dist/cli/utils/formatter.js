"use strict";
/**
 * Output formatting utilities using chalk
 * User-first experience with clear, styled output
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = void 0;
exports.formatHeader = formatHeader;
exports.formatSubheader = formatSubheader;
exports.formatSuccess = formatSuccess;
exports.formatError = formatError;
exports.formatWarning = formatWarning;
exports.formatInfo = formatInfo;
exports.formatListItem = formatListItem;
exports.formatKeyValue = formatKeyValue;
exports.formatProgress = formatProgress;
exports.formatBox = formatBox;
exports.formatCurrency = formatCurrency;
exports.formatSummary = formatSummary;
exports.clearScreen = clearScreen;
exports.print = print;
exports.printInline = printInline;
const chalk_1 = __importDefault(require("chalk"));
exports.colors = {
    primary: chalk_1.default.cyan,
    success: chalk_1.default.green,
    error: chalk_1.default.red,
    warning: chalk_1.default.yellow,
    info: chalk_1.default.blue,
    muted: chalk_1.default.gray,
    bold: chalk_1.default.bold,
    highlight: chalk_1.default.cyan.bold,
};
/**
 * Format a header with consistent styling
 */
function formatHeader(text) {
    return `\n${exports.colors.primary.bold('━'.repeat(50))}\n${exports.colors.highlight(text)}\n${exports.colors.primary.bold('━'.repeat(50))}\n`;
}
/**
 * Format a subheader
 */
function formatSubheader(text) {
    return `\n${exports.colors.primary(text)}\n`;
}
/**
 * Format success message
 */
function formatSuccess(text) {
    return exports.colors.success(`✓ ${text}`);
}
/**
 * Format error message
 */
function formatError(text) {
    return exports.colors.error(`✗ ${text}`);
}
/**
 * Format warning message
 */
function formatWarning(text) {
    return exports.colors.warning(`⚠ ${text}`);
}
/**
 * Format info message
 */
function formatInfo(text) {
    return exports.colors.info(`ℹ ${text}`);
}
/**
 * Format a list item
 */
function formatListItem(text, level = 0) {
    const indent = '  '.repeat(level);
    return `${indent}${exports.colors.muted('•')} ${text}`;
}
/**
 * Format a key-value pair
 */
function formatKeyValue(key, value) {
    return `${exports.colors.bold(key)}: ${value}`;
}
/**
 * Format progress indicator
 * FR-011: Clear progress indication
 */
function formatProgress(current, total, step) {
    return exports.colors.muted(`[Step ${current}/${total}] `) + step;
}
/**
 * Format a box around text
 */
function formatBox(lines) {
    const maxLength = Math.max(...lines.map(line => line.length));
    const horizontalBorder = exports.colors.primary('─'.repeat(maxLength + 4));
    const formattedLines = lines.map(line => {
        const padding = ' '.repeat(maxLength - line.length);
        return exports.colors.primary('│ ') + line + padding + exports.colors.primary(' │');
    });
    return [
        exports.colors.primary('┌' + horizontalBorder.replace(/─/g, '─') + '┐'),
        ...formattedLines,
        exports.colors.primary('└' + horizontalBorder.replace(/─/g, '─') + '┘')
    ].join('\n');
}
/**
 * Format currency
 */
function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}
/**
 * Format a summary section
 */
function formatSummary(items) {
    const lines = items.map(item => `${exports.colors.muted(item.label.padEnd(25))}: ${exports.colors.bold(item.value)}`);
    return lines.join('\n');
}
/**
 * Clear console
 */
function clearScreen() {
    console.clear();
}
/**
 * Print with newline
 */
function print(text) {
    console.log(text);
}
/**
 * Print without newline
 */
function printInline(text) {
    process.stdout.write(text);
}
//# sourceMappingURL=formatter.js.map