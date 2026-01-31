/**
 * Certificate API Client
 * Handles communication with the certificate generation API
 * Feature 002: FR-001, FR-002, FR-003
 * Updated: Now supports both C-Corp (Certificate of Incorporation) and LLC (Certificate of Formation)
 */
import { CertificateGenerationRequest, CertificateGenerationResponse, CertificateApiConfig } from './types';
/**
 * Certificate API Client
 * Communicates with the certificate generation service
 */
export declare class CertificateApiClient {
    private client;
    constructor(config?: CertificateApiConfig);
    /**
     * Generate certificate (Certificate of Incorporation for Corps, Certificate of Formation for LLCs)
     * POST /certificates
     * @param request - Certificate generation request payload
     * @returns Certificate generation response with download URL
     */
    generateCertificate(request: CertificateGenerationRequest): Promise<CertificateGenerationResponse>;
    /**
     * Validate certificate generation request
     * Validates based on company type (LLC vs C-Corp/S-Corp)
     */
    private validateRequest;
    /**
     * Validate certificate generation response
     */
    private validateResponse;
    /**
     * Handle API errors with user-friendly messages
     */
    private handleApiError;
    /**
     * Check if a download URL has expired
     * @param expiresAt - Expiration timestamp from API response
     * @returns True if the URL has expired
     */
    isUrlExpired(expiresAt: string | Date): boolean;
    /**
     * Calculate time remaining until URL expires
     * @param expiresAt - Expiration timestamp from API response
     * @returns Minutes remaining, or 0 if expired
     */
    getMinutesRemaining(expiresAt: string | Date): number;
}
//# sourceMappingURL=api.d.ts.map