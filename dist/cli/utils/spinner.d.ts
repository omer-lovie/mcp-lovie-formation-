/**
 * Spinner utilities for loading indicators
 * FR-009: Show loading indicators/spinners during background operations
 */
export declare class SpinnerManager {
    private spinner;
    /**
     * Start a spinner with a message
     */
    start(message: string): void;
    /**
     * Update spinner text
     */
    update(message: string): void;
    /**
     * Mark spinner as successful
     */
    succeed(message?: string): void;
    /**
     * Mark spinner as failed
     */
    fail(message?: string): void;
    /**
     * Show warning
     */
    warn(message: string): void;
    /**
     * Show info
     */
    info(message: string): void;
    /**
     * Stop spinner without status
     */
    stop(): void;
    /**
     * Check if spinner is active
     */
    isSpinning(): boolean;
}
export declare const spinner: SpinnerManager;
//# sourceMappingURL=spinner.d.ts.map