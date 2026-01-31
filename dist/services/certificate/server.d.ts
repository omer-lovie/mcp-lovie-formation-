/**
 * Local web server for certificate review
 * Displays PDF in browser with approval button
 * Feature 002: FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010
 */
import { EventEmitter } from 'events';
/**
 * Server events
 */
export declare enum ServerEvent {
    APPROVED = "approved",
    CANCELLED = "cancelled",
    TIMEOUT = "timeout",
    ERROR = "error"
}
/**
 * Certificate review server
 * Hosts a simple web interface for PDF preview and approval
 */
export declare class CertificateReviewServer extends EventEmitter {
    private server;
    private port;
    private isRunning;
    private timeoutHandle;
    /**
     * Start the server and wait for user action
     * @param certificateUrl - Presigned S3 URL for the certificate PDF
     * @param companyName - Company name for display
     * @returns Promise that resolves when user approves or cancels
     */
    start(certificateUrl: string, companyName: string): Promise<void>;
    /**
     * Stop the server
     */
    stop(): Promise<void>;
    /**
     * Get the local server URL
     */
    getUrl(): string;
    /**
     * Check if server is running
     */
    getIsRunning(): boolean;
    /**
     * Handle HTTP requests
     */
    private handleRequest;
    /**
     * Serve the main certificate review page
     */
    private serveMainPage;
    /**
     * Handle approval request
     */
    private handleApproval;
    /**
     * Handle cancellation request
     */
    private handleCancellation;
    /**
     * Generate HTML for certificate review page
     */
    private generateHtml;
    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml;
    /**
     * Find an available port
     */
    private findAvailablePort;
    /**
     * Check if a port is available
     */
    private isPortAvailable;
}
//# sourceMappingURL=server.d.ts.map