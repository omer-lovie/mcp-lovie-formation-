/**
 * Configuration management for Lovie CLI
 */
interface CliConfig {
    apiBaseUrl: string;
    apiKey: string;
    sessionStoragePath: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableUpdateCheck: boolean;
    enableAnalytics: boolean;
}
/**
 * Get configuration from environment variables
 */
export declare function getConfig(): CliConfig;
/**
 * Validate configuration
 */
export declare function validateConfig(config: CliConfig): void;
/**
 * Get agent API URLs with environment-based selection
 */
export declare function getAgentApiUrls(): {
    nameCheck: string;
    documentFiller: string;
    filing: string;
};
export {};
//# sourceMappingURL=config.d.ts.map