/**
 * Session Storage Service
 * Provides persistent storage for certificate data across formation steps
 *
 * Features:
 * - File-based JSON storage for certificate data
 * - Automatic expiry handling for temporary URLs
 * - Session-based data isolation
 * - Cleanup utilities for old/expired data
 */
import { StoredCertificateData, StorageCertificateMetadata, CertificateStorageResult, StorageCertificateRetrievalResult } from '../types/certificate-storage';
export declare class SessionStorage {
    private readonly storageDir;
    private readonly certificateFile;
    constructor();
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDir;
    /**
     * Load all certificate data from storage
     */
    private loadAllCertificates;
    /**
     * Save all certificate data to storage
     */
    private saveAllCertificates;
    /**
     * Generate a unique certificate identifier
     */
    private generateCertificateId;
    /**
     * Check if a certificate is still valid
     */
    private isCertificateValid;
    /**
     * Save certificate data for a session
     *
     * @param sessionId - The session ID this certificate belongs to
     * @param downloadUrl - Public download URL for the certificate
     * @param s3Uri - S3 URI for internal reference
     * @param metadata - Certificate metadata
     * @param expiresAt - Optional expiry date for temporary URLs
     * @returns Storage result with certificate ID
     */
    saveCertificateData(sessionId: string, downloadUrl: string, s3Uri: string, metadata: StorageCertificateMetadata, expiresAt?: Date): CertificateStorageResult;
    /**
     * Get certificate data by certificate ID
     *
     * @param certificateId - The certificate identifier
     * @returns Certificate data or null if not found
     */
    getCertificateDataById(certificateId: string): StorageCertificateRetrievalResult;
    /**
     * Get certificate data for a specific session
     * Returns the most recent valid certificate for the session
     *
     * @param sessionId - The session identifier
     * @returns Certificate data or null if not found
     */
    getCertificateData(sessionId: string): StorageCertificateRetrievalResult;
    /**
     * Get all certificate data for a session
     *
     * @param sessionId - The session identifier
     * @returns Array of all certificates for the session
     */
    getAllCertificatesForSession(sessionId: string): StoredCertificateData[];
    /**
     * Mark a certificate as downloaded
     *
     * @param certificateId - The certificate identifier
     * @returns Success status
     */
    markCertificateDownloaded(certificateId: string): boolean;
    /**
     * Invalidate a certificate (mark as no longer valid)
     *
     * @param certificateId - The certificate identifier
     * @returns Success status
     */
    invalidateCertificate(certificateId: string): boolean;
    /**
     * Clear all certificate data for a specific session
     *
     * @param sessionId - The session identifier
     * @returns Number of certificates cleared
     */
    clearCertificateData(sessionId: string): number;
    /**
     * Clear a specific certificate by ID
     *
     * @param certificateId - The certificate identifier
     * @returns Success status
     */
    clearCertificateById(certificateId: string): boolean;
    /**
     * Clean up expired certificates
     * Removes certificates that have passed their expiry date
     *
     * @returns Number of certificates cleaned up
     */
    cleanupExpiredCertificates(): number;
    /**
     * Clean up old certificates (older than specified days)
     *
     * @param daysOld - Number of days to consider as old (default: 90)
     * @returns Number of certificates cleaned up
     */
    cleanupOldCertificates(daysOld?: number): number;
    /**
     * Get certificate storage statistics
     *
     * @returns Statistics about stored certificates
     */
    getStorageStats(): {
        total: number;
        valid: number;
        expired: number;
        downloaded: number;
    };
    /**
     * Update certificate download URL (for refreshing expired temporary URLs)
     *
     * @param certificateId - The certificate identifier
     * @param newDownloadUrl - The new download URL
     * @param newExpiresAt - Optional new expiry date
     * @returns Success status
     */
    updateCertificateUrl(certificateId: string, newDownloadUrl: string, newExpiresAt?: Date): boolean;
}
export declare const sessionStorage: SessionStorage;
//# sourceMappingURL=session-storage.d.ts.map