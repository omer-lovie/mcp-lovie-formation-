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

import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  StoredCertificateData,
  StorageCertificateMetadata,
  CertificateStorageResult,
  StorageCertificateRetrievalResult
} from '../types/certificate-storage';

export class SessionStorage {
  private readonly storageDir: string;
  private readonly certificateFile: string;

  constructor() {
    // Store certificate data in user's home directory alongside sessions
    this.storageDir = path.join(os.homedir(), '.lovie', 'certificates');
    this.certificateFile = path.join(this.storageDir, 'certificates.json');
    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Load all certificate data from storage
   */
  private loadAllCertificates(): Record<string, StoredCertificateData> {
    if (!fs.existsSync(this.certificateFile)) {
      return {};
    }

    try {
      const data = fs.readFileSync(this.certificateFile, 'utf-8');
      const parsed = JSON.parse(data);

      // Dates already stored as ISO strings, return as-is
      return parsed;
    } catch (error) {
      console.error('Error loading certificates:', error);
      return {};
    }
  }

  /**
   * Save all certificate data to storage
   */
  private saveAllCertificates(certificates: Record<string, StoredCertificateData>): void {
    try {
      // Data already in serializable format (ISO strings)
      fs.writeFileSync(
        this.certificateFile,
        JSON.stringify(certificates, null, 2),
        { encoding: 'utf-8', mode: 0o600 }
      );
    } catch (error) {
      console.error('Error saving certificates:', error);
      throw new Error('Failed to save certificate data');
    }
  }

  /**
   * Generate a unique certificate identifier
   */
  private generateCertificateId(): string {
    return `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a certificate is still valid
   */
  private isCertificateValid(cert: StoredCertificateData): boolean {
    // Check if certificate has expired
    if (cert.expiresAt && new Date(cert.expiresAt) < new Date()) {
      return false;
    }

    return cert.isValid;
  }

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
  saveCertificateData(
    sessionId: string,
    downloadUrl: string,
    s3Uri: string,
    metadata: StorageCertificateMetadata,
    expiresAt?: Date
  ): CertificateStorageResult {
    try {
      const certificates = this.loadAllCertificates();
      const certificateId = this.generateCertificateId();

      const certificateData: StoredCertificateData = {
        certificateId,
        downloadUrl,
        s3Uri,
        metadata,
        sessionId,
        storedAt: new Date().toISOString(),
        expiresAt: expiresAt?.toISOString(),
        isValid: true
      };

      certificates[certificateId] = certificateData;
      this.saveAllCertificates(certificates);

      return {
        success: true,
        certificateId
      };
    } catch (error) {
      console.error('Error saving certificate data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get certificate data by certificate ID
   *
   * @param certificateId - The certificate identifier
   * @returns Certificate data or null if not found
   */
  getCertificateDataById(certificateId: string): StorageCertificateRetrievalResult {
    try {
      const certificates = this.loadAllCertificates();
      const cert = certificates[certificateId];

      if (!cert) {
        return {
          success: false,
          error: 'Certificate not found'
        };
      }

      // Check validity
      if (!this.isCertificateValid(cert)) {
        return {
          success: false,
          error: 'Certificate has expired or is no longer valid'
        };
      }

      return {
        success: true,
        data: cert
      };
    } catch (error) {
      console.error('Error retrieving certificate:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get certificate data for a specific session
   * Returns the most recent valid certificate for the session
   *
   * @param sessionId - The session identifier
   * @returns Certificate data or null if not found
   */
  getCertificateData(sessionId: string): StorageCertificateRetrievalResult {
    try {
      const certificates = this.loadAllCertificates();

      // Find all certificates for this session
      const sessionCerts = Object.values(certificates)
        .filter(cert => cert.sessionId === sessionId && this.isCertificateValid(cert))
        .sort((a, b) => new Date(b.storedAt).getTime() - new Date(a.storedAt).getTime());

      if (sessionCerts.length === 0) {
        return {
          success: false,
          error: 'No valid certificate found for session'
        };
      }

      // Return most recent certificate
      return {
        success: true,
        data: sessionCerts[0]
      };
    } catch (error) {
      console.error('Error retrieving certificate data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all certificate data for a session
   *
   * @param sessionId - The session identifier
   * @returns Array of all certificates for the session
   */
  getAllCertificatesForSession(sessionId: string): StoredCertificateData[] {
    try {
      const certificates = this.loadAllCertificates();

      return Object.values(certificates)
        .filter(cert => cert.sessionId === sessionId)
        .sort((a, b) => new Date(b.storedAt).getTime() - new Date(a.storedAt).getTime());
    } catch (error) {
      console.error('Error retrieving certificates:', error);
      return [];
    }
  }

  /**
   * Mark a certificate as downloaded
   *
   * @param certificateId - The certificate identifier
   * @returns Success status
   */
  markCertificateDownloaded(certificateId: string): boolean {
    try {
      const certificates = this.loadAllCertificates();
      const cert = certificates[certificateId];

      if (!cert) {
        return false;
      }

      cert.metadata.downloaded = true;
      cert.metadata.downloadedAt = new Date().toISOString();

      this.saveAllCertificates(certificates);
      return true;
    } catch (error) {
      console.error('Error marking certificate as downloaded:', error);
      return false;
    }
  }

  /**
   * Invalidate a certificate (mark as no longer valid)
   *
   * @param certificateId - The certificate identifier
   * @returns Success status
   */
  invalidateCertificate(certificateId: string): boolean {
    try {
      const certificates = this.loadAllCertificates();
      const cert = certificates[certificateId];

      if (!cert) {
        return false;
      }

      cert.isValid = false;
      this.saveAllCertificates(certificates);
      return true;
    } catch (error) {
      console.error('Error invalidating certificate:', error);
      return false;
    }
  }

  /**
   * Clear all certificate data for a specific session
   *
   * @param sessionId - The session identifier
   * @returns Number of certificates cleared
   */
  clearCertificateData(sessionId: string): number {
    try {
      const certificates = this.loadAllCertificates();
      let clearedCount = 0;

      for (const key in certificates) {
        if (certificates[key].sessionId === sessionId) {
          delete certificates[key];
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        this.saveAllCertificates(certificates);
      }

      return clearedCount;
    } catch (error) {
      console.error('Error clearing certificate data:', error);
      return 0;
    }
  }

  /**
   * Clear a specific certificate by ID
   *
   * @param certificateId - The certificate identifier
   * @returns Success status
   */
  clearCertificateById(certificateId: string): boolean {
    try {
      const certificates = this.loadAllCertificates();

      if (!certificates[certificateId]) {
        return false;
      }

      delete certificates[certificateId];
      this.saveAllCertificates(certificates);
      return true;
    } catch (error) {
      console.error('Error clearing certificate:', error);
      return false;
    }
  }

  /**
   * Clean up expired certificates
   * Removes certificates that have passed their expiry date
   *
   * @returns Number of certificates cleaned up
   */
  cleanupExpiredCertificates(): number {
    try {
      const certificates = this.loadAllCertificates();
      const now = new Date();
      let cleanedCount = 0;

      for (const key in certificates) {
        const cert = certificates[key];
        if (cert.expiresAt && new Date(cert.expiresAt) < now) {
          delete certificates[key];
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.saveAllCertificates(certificates);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired certificates:', error);
      return 0;
    }
  }

  /**
   * Clean up old certificates (older than specified days)
   *
   * @param daysOld - Number of days to consider as old (default: 90)
   * @returns Number of certificates cleaned up
   */
  cleanupOldCertificates(daysOld: number = 90): number {
    try {
      const certificates = this.loadAllCertificates();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      let cleanedCount = 0;

      for (const key in certificates) {
        const cert = certificates[key];
        if (new Date(cert.storedAt) < cutoffDate) {
          delete certificates[key];
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.saveAllCertificates(certificates);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up old certificates:', error);
      return 0;
    }
  }

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
  } {
    try {
      const certificates = this.loadAllCertificates();
      const certs = Object.values(certificates);
      const now = new Date();

      return {
        total: certs.length,
        valid: certs.filter(cert => this.isCertificateValid(cert)).length,
        expired: certs.filter(cert => cert.expiresAt && new Date(cert.expiresAt) < now).length,
        downloaded: certs.filter(cert => cert.metadata.downloaded === true).length
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { total: 0, valid: 0, expired: 0, downloaded: 0 };
    }
  }

  /**
   * Update certificate download URL (for refreshing expired temporary URLs)
   *
   * @param certificateId - The certificate identifier
   * @param newDownloadUrl - The new download URL
   * @param newExpiresAt - Optional new expiry date
   * @returns Success status
   */
  updateCertificateUrl(
    certificateId: string,
    newDownloadUrl: string,
    newExpiresAt?: Date
  ): boolean {
    try {
      const certificates = this.loadAllCertificates();
      const cert = certificates[certificateId];

      if (!cert) {
        return false;
      }

      cert.downloadUrl = newDownloadUrl;
      if (newExpiresAt) {
        cert.expiresAt = newExpiresAt.toISOString();
      }
      cert.isValid = true; // Mark as valid again with new URL

      this.saveAllCertificates(certificates);
      return true;
    } catch (error) {
      console.error('Error updating certificate URL:', error);
      return false;
    }
  }
}

// Export singleton instance for convenience
export const sessionStorage = new SessionStorage();
