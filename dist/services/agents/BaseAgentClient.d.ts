/**
 * Base agent client with retry logic (FR-036), error handling (FR-037),
 * and health checking (FR-035)
 */
import { AxiosInstance } from 'axios';
import { AgentClientConfig, AgentClientOptions, ConnectionHealth, RetryConfig } from './types';
export declare abstract class BaseAgentClient {
    protected readonly config: AgentClientConfig;
    protected readonly client: AxiosInstance;
    protected readonly retryConfig: RetryConfig;
    protected readonly agentName: string;
    private healthCheckTimer?;
    private lastHealth?;
    constructor(agentName: string, config: AgentClientConfig);
    /**
     * Check agent health and connectivity
     */
    checkHealth(): Promise<ConnectionHealth>;
    /**
     * Get last known health status
     */
    getLastHealth(): ConnectionHealth | undefined;
    /**
     * Start automatic health checking
     */
    private startHealthChecking;
    /**
     * Stop automatic health checking
     */
    stopHealthChecking(): void;
    /**
     * Check network connectivity
     */
    checkConnectivity(): Promise<boolean>;
    /**
     * Execute GET request with retry logic
     */
    protected get<T>(path: string, options?: AgentClientOptions): Promise<T>;
    /**
     * Execute POST request with retry logic
     */
    protected post<T>(path: string, data?: unknown, options?: AgentClientOptions): Promise<T>;
    /**
     * Execute PUT request with retry logic
     */
    protected put<T>(path: string, data?: unknown, options?: AgentClientOptions): Promise<T>;
    /**
     * Execute DELETE request with retry logic
     */
    protected delete<T>(path: string, options?: AgentClientOptions): Promise<T>;
    /**
     * Execute request with automatic retry logic
     */
    private executeWithRetry;
    /**
     * Build axios request config from options
     */
    private buildRequestConfig;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Calculate retry delay with exponential backoff
     */
    private calculateRetryDelay;
    /**
     * Sleep for specified milliseconds
     */
    protected sleep(ms: number): Promise<void>;
    /**
     * Handle axios errors and convert to AgentError
     */
    private handleAxiosError;
    /**
     * Create standardized AgentError from various error types
     */
    private createAgentError;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
//# sourceMappingURL=BaseAgentClient.d.ts.map