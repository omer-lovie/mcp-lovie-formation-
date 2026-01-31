/**
 * Display utilities for CLI interface
 * Uses chalk for colors and ora for spinners
 * Professional design aligned with Lovie brand (AI-First Banking and Finance)
 */
import { Ora } from 'ora';
import { Company, PaymentDetails, FilingResult } from '../types';
export declare class Display {
    private static readonly BRAND_PRIMARY;
    private static readonly BRAND_SUCCESS;
    private static readonly BRAND_WARNING;
    private static readonly BRAND_ERROR;
    private static readonly BRAND_ACCENT;
    /**
     * Display enhanced Lovie welcome banner
     */
    static welcome(): void;
    /**
     * Display enhanced section header with box
     */
    static section(title: string): void;
    /**
     * Display step header with professional design
     */
    static stepHeader(current: number, total: number, icon: string, title: string): void;
    /**
     * Create a visual progress bar
     */
    private static createProgressBar;
    /**
     * Display recommended option box (for partnerships/suggestions)
     */
    static recommendedBox(title: string, items: string[], note?: string): void;
    /**
     * Wrap text to fit within specified width
     */
    private static wrapText;
    /**
     * Display info box
     */
    static infoBox(message: string): void;
    /**
     * Display progress indicator
     */
    static progress(current: number, total: number, stepName: string): void;
    /**
     * Display success message with enhanced styling
     */
    static success(message: string): void;
    /**
     * Display success box for important confirmations
     */
    static successBox(message: string, details?: string[]): void;
    /**
     * Display error message with enhanced styling
     */
    static error(message: string): void;
    /**
     * Display error box for critical errors
     */
    static errorBox(message: string, details?: string[]): void;
    /**
     * Display warning message with enhanced styling
     */
    static warning(message: string): void;
    /**
     * Display info message with enhanced styling
     */
    static info(message: string): void;
    /**
     * Display enhanced company summary with professional layout
     */
    static companySummary(company: Partial<Company>): void;
    /**
     * Display payment details
     */
    static paymentDetails(details: PaymentDetails): void;
    /**
     * Display filing confirmation
     */
    static filingConfirmation(result: FilingResult): void;
    /**
     * Display next steps
     */
    static nextSteps(): void;
    /**
     * Create a spinner for loading operations
     */
    static spinner(text: string): Ora;
    /**
     * Display a blank line
     */
    static blank(): void;
    /**
     * Clear the console
     */
    static clear(): void;
    /**
     * Display help text
     */
    static helpText(text: string): void;
    /**
     * Display update notification
     */
    static updateAvailable(currentVersion: string, latestVersion: string): void;
    /**
     * Display connection error
     */
    static connectionError(): void;
    /**
     * Display support info
     */
    static supportInfo(): void;
}
//# sourceMappingURL=display.d.ts.map