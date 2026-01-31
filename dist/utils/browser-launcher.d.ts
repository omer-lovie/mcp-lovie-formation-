/**
 * Cross-platform browser launcher utility
 * Opens the default system browser to a specified URL
 * Feature 002: FR-008 (Browser Auto-Open)
 */
/**
 * Browser launch result
 */
export interface BrowserLaunchResult {
    success: boolean;
    error?: string;
    manualUrl?: string;
}
/**
 * Open URL in the default system browser
 * Supports macOS, Windows, and Linux
 *
 * @param url - The URL to open
 * @returns Promise with launch result
 */
export declare function openBrowser(url: string): Promise<BrowserLaunchResult>;
/**
 * Check if a URL is accessible
 * Used to verify local server is running before opening browser
 *
 * @param url - The URL to check
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves to true if URL is accessible
 */
export declare function waitForServer(url: string, timeoutMs?: number): Promise<boolean>;
/**
 * Open browser and wait for server to be ready
 * This ensures the server is listening before opening the browser
 *
 * @param url - The URL to open
 * @param waitForReady - Whether to wait for server to be ready (default: true)
 * @returns Promise with launch result
 */
export declare function openBrowserWhenReady(url: string, waitForReady?: boolean): Promise<BrowserLaunchResult>;
/**
 * Get platform-specific instructions for manually opening a browser
 * Used when auto-open fails
 *
 * @param url - The URL to open
 * @returns Human-readable instructions
 */
export declare function getManualOpenInstructions(url: string): string;
//# sourceMappingURL=browser-launcher.d.ts.map