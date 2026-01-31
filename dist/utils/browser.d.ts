/**
 * Browser launcher utility
 * Opens URLs in the user's default browser
 * Feature 002: FR-005
 */
/**
 * Open a URL in the user's default browser
 * @param url - URL to open
 * @throws Error if unable to open browser
 */
export declare function openBrowser(url: string): Promise<void>;
/**
 * Check if the system has a default browser configured
 * @returns True if a default browser is available
 */
export declare function hasDefaultBrowser(): Promise<boolean>;
//# sourceMappingURL=browser.d.ts.map