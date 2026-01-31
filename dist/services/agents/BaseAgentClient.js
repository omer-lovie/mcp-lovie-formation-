"use strict";
/**
 * Base agent client with retry logic (FR-036), error handling (FR-037),
 * and health checking (FR-035)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgentClient = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("./types");
class BaseAgentClient {
    constructor(agentName, config) {
        this.config = config;
        this.agentName = agentName;
        this.retryConfig = { ...types_1.DEFAULT_RETRY_CONFIG, ...config.retryConfig };
        // Initialize axios client
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Lovie-CLI/1.0.0',
                ...config.headers,
                ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
            },
        });
        // Setup response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => this.handleAxiosError(error));
        // Start auto health checking if configured
        if (config.healthCheckInterval && config.healthCheckInterval > 0) {
            this.startHealthChecking(config.healthCheckInterval);
        }
    }
    // ========================================================================
    // Health Checking (FR-035)
    // ========================================================================
    /**
     * Check agent health and connectivity
     */
    async checkHealth() {
        const startTime = Date.now();
        try {
            const response = await this.client.get('/health', {
                timeout: 5000, // Quick health check
            });
            const latency = Date.now() - startTime;
            const health = {
                agentName: this.agentName,
                status: response.data.status,
                latency,
                lastSuccessfulRequest: new Date().toISOString(),
                lastSuccessfulCheck: new Date().toISOString(),
                consecutiveFailures: 0,
            };
            this.lastHealth = health;
            return health;
        }
        catch (error) {
            const latency = Date.now() - startTime;
            const previousFailures = this.lastHealth?.consecutiveFailures || 0;
            const health = {
                agentName: this.agentName,
                status: 'offline',
                latency,
                lastSuccessfulRequest: this.lastHealth?.lastSuccessfulRequest || '',
                lastSuccessfulCheck: this.lastHealth?.lastSuccessfulCheck || '',
                lastFailedCheck: new Date().toISOString(),
                consecutiveFailures: previousFailures + 1,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            };
            this.lastHealth = health;
            return health;
        }
    }
    /**
     * Get last known health status
     */
    getLastHealth() {
        return this.lastHealth;
    }
    /**
     * Start automatic health checking
     */
    startHealthChecking(intervalMs) {
        this.healthCheckTimer = setInterval(async () => {
            await this.checkHealth();
        }, intervalMs);
    }
    /**
     * Stop automatic health checking
     */
    stopHealthChecking() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }
    /**
     * Check network connectivity
     */
    async checkConnectivity() {
        try {
            // Try to reach a reliable endpoint
            await axios_1.default.get('https://www.google.com', {
                timeout: 3000,
                validateStatus: () => true, // Accept any status
            });
            return true;
        }
        catch {
            return false;
        }
    }
    // ========================================================================
    // Request Methods with Retry Logic (FR-036)
    // ========================================================================
    /**
     * Execute GET request with retry logic
     */
    async get(path, options) {
        return this.executeWithRetry(async (config) => {
            const response = await this.client.get(path, config);
            return response.data;
        }, options);
    }
    /**
     * Execute POST request with retry logic
     */
    async post(path, data, options) {
        return this.executeWithRetry(async (config) => {
            const response = await this.client.post(path, data, config);
            return response.data;
        }, options);
    }
    /**
     * Execute PUT request with retry logic
     */
    async put(path, data, options) {
        return this.executeWithRetry(async (config) => {
            const response = await this.client.put(path, data, config);
            return response.data;
        }, options);
    }
    /**
     * Execute DELETE request with retry logic
     */
    async delete(path, options) {
        return this.executeWithRetry(async (config) => {
            const response = await this.client.delete(path, config);
            return response.data;
        }, options);
    }
    // ========================================================================
    // Retry Logic Implementation (FR-036)
    // ========================================================================
    /**
     * Execute request with automatic retry logic
     */
    async executeWithRetry(requestFn, options) {
        // Skip retry if explicitly disabled
        if (options?.skipRetry) {
            return requestFn(this.buildRequestConfig(options));
        }
        let lastError;
        let attempt = 0;
        while (attempt < this.retryConfig.maxAttempts) {
            attempt++;
            try {
                const config = this.buildRequestConfig(options);
                return await requestFn(config);
            }
            catch (error) {
                lastError = error;
                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    throw this.createAgentError(error, false);
                }
                // Don't retry on last attempt
                if (attempt >= this.retryConfig.maxAttempts) {
                    throw this.createAgentError(error, true);
                }
                // Calculate delay with exponential backoff
                const delay = this.calculateRetryDelay(attempt);
                // Wait before retry
                await this.sleep(delay);
                // Log retry attempt (in production, use proper logging)
                console.warn(`[${this.agentName}] Retry attempt ${attempt}/${this.retryConfig.maxAttempts} after ${delay}ms`);
            }
        }
        // This should never be reached, but TypeScript needs it
        throw this.createAgentError(lastError || new Error('Maximum retries exceeded'), true);
    }
    /**
     * Build axios request config from options
     */
    buildRequestConfig(options) {
        const config = {};
        if (options?.signal) {
            config.signal = options.signal;
        }
        if (options?.timeout) {
            config.timeout = options.timeout;
        }
        if (options?.idempotencyKey) {
            config.headers = {
                ...config.headers,
                'Idempotency-Key': options.idempotencyKey,
            };
        }
        return config;
    }
    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            // Network errors are retryable
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
                return true;
            }
            // Check HTTP status codes
            if (axiosError.response?.status &&
                this.retryConfig.retryableStatusCodes?.includes(axiosError.response.status)) {
                return true;
            }
            // Check custom error codes from response
            const errorCode = axiosError.response?.data?.code;
            if (errorCode &&
                this.retryConfig.retryableErrorCodes?.includes(errorCode)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(attempt) {
        const delay = this.retryConfig.initialDelayMs *
            Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        return Math.min(delay, this.retryConfig.maxDelayMs);
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    // ========================================================================
    // Error Handling (FR-037)
    // ========================================================================
    /**
     * Handle axios errors and convert to AgentError
     */
    handleAxiosError(error) {
        throw this.createAgentError(error, this.isRetryableError(error));
    }
    /**
     * Create standardized AgentError from various error types
     */
    createAgentError(error, retryable) {
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            // Network/timeout errors
            if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
                return new types_1.AgentError(`Request timeout for ${this.agentName}`, 'TIMEOUT', true, undefined, { originalError: axiosError.message });
            }
            // Server returned error response
            if (axiosError.response) {
                const status = axiosError.response.status;
                const data = axiosError.response.data;
                return new types_1.AgentError(data?.message || `${this.agentName} error: ${status}`, data?.code || `HTTP_${status}`, retryable, data?.retryAfter, {
                    status,
                    statusText: axiosError.response.statusText,
                    data,
                });
            }
            // Request was made but no response received
            return new types_1.AgentError(`No response from ${this.agentName}`, 'NETWORK_ERROR', true, undefined, { originalError: axiosError.message });
        }
        // Generic error
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new types_1.AgentError(`${this.agentName} error: ${message}`, 'UNKNOWN_ERROR', retryable, undefined, { originalError: error });
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopHealthChecking();
    }
}
exports.BaseAgentClient = BaseAgentClient;
//# sourceMappingURL=BaseAgentClient.js.map