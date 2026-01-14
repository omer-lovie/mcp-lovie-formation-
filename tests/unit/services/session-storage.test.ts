/**
 * Unit tests for SessionStorage service
 * Tests certificate data persistence, retrieval, and cleanup operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionStorage } from '../../../src/services/session-storage';
import { StorageCertificateMetadata } from '../../../src/types/certificate-storage';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('SessionStorage', () => {
  let storage: SessionStorage;
  const testStorageDir = path.join(os.tmpdir(), '.lovie-test', 'certificates');
  const testCertificateFile = path.join(testStorageDir, 'certificates.json');

  // Mock data
  const mockSessionId = 'session-test-12345';
  const mockDownloadUrl = 'https://example.com/certificate.pdf';
  const mockS3Uri = 's3://bucket/certificates/cert-12345.pdf';
  const mockMetadata: StorageCertificateMetadata = {
    companyName: 'Test Company LLC',
    state: 'DE',
    companyType: 'LLC',
    generatedAt: '2025-12-23T10:00:00.000Z',
    filingNumber: 'FN-12345',
    confirmationNumber: 'CN-67890',
    format: 'PDF',
    fileSizeBytes: 102400,
    downloaded: false
  };

  beforeEach(() => {
    // Create test storage directory
    if (!fs.existsSync(testStorageDir)) {
      fs.mkdirSync(testStorageDir, { recursive: true });
    }

    // Override storage paths for testing
    storage = new SessionStorage();
    (storage as any).storageDir = testStorageDir;
    (storage as any).certificateFile = testCertificateFile;
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testCertificateFile)) {
      fs.unlinkSync(testCertificateFile);
    }
  });

  describe('saveCertificateData', () => {
    it('should save certificate data successfully', () => {
      const result = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      expect(result.success).toBe(true);
      expect(result.certificateId).toBeDefined();
      expect(result.certificateId).toMatch(/^cert-\d+-[a-z0-9]+$/);
    });

    it('should save certificate with expiry date', () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const result = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata,
        expiresAt
      );

      expect(result.success).toBe(true);

      const retrieved = storage.getCertificateDataById(result.certificateId!);
      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.expiresAt).toBeDefined();
    });

    it('should persist data to disk', () => {
      storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      expect(fs.existsSync(testCertificateFile)).toBe(true);
      const fileContent = fs.readFileSync(testCertificateFile, 'utf-8');
      const data = JSON.parse(fileContent);
      expect(Object.keys(data).length).toBeGreaterThan(0);
    });
  });

  describe('getCertificateData', () => {
    it('should retrieve certificate data by session ID', () => {
      const saveResult = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      const retrieveResult = storage.getCertificateData(mockSessionId);

      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data?.sessionId).toBe(mockSessionId);
      expect(retrieveResult.data?.downloadUrl).toBe(mockDownloadUrl);
      expect(retrieveResult.data?.s3Uri).toBe(mockS3Uri);
      expect(retrieveResult.data?.metadata.companyName).toBe(mockMetadata.companyName);
    });

    it('should return error for non-existent session', () => {
      const result = storage.getCertificateData('non-existent-session');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return most recent certificate for session with multiple certificates', () => {
      // Save first certificate
      storage.saveCertificateData(
        mockSessionId,
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );

      // Wait a moment to ensure different timestamps
      setTimeout(() => {}, 10);

      // Save second certificate
      const secondResult = storage.saveCertificateData(
        mockSessionId,
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      const retrieveResult = storage.getCertificateData(mockSessionId);

      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data?.downloadUrl).toBe('https://example.com/cert2.pdf');
    });

    it('should skip expired certificates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata,
        pastDate
      );

      const result = storage.getCertificateData(mockSessionId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('getCertificateDataById', () => {
    it('should retrieve certificate by ID', () => {
      const saveResult = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      const retrieveResult = storage.getCertificateDataById(saveResult.certificateId!);

      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data?.certificateId).toBe(saveResult.certificateId);
    });

    it('should return error for non-existent certificate ID', () => {
      const result = storage.getCertificateDataById('non-existent-cert');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Certificate not found');
    });
  });

  describe('getAllCertificatesForSession', () => {
    it('should return all certificates for a session', () => {
      storage.saveCertificateData(
        mockSessionId,
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );
      storage.saveCertificateData(
        mockSessionId,
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      const certificates = storage.getAllCertificatesForSession(mockSessionId);

      expect(certificates.length).toBe(2);
      expect(certificates.every(cert => cert.sessionId === mockSessionId)).toBe(true);
    });

    it('should return certificates sorted by most recent first', () => {
      const firstResult = storage.saveCertificateData(
        mockSessionId,
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );

      setTimeout(() => {}, 10);

      const secondResult = storage.saveCertificateData(
        mockSessionId,
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      const certificates = storage.getAllCertificatesForSession(mockSessionId);

      expect(certificates[0].certificateId).toBe(secondResult.certificateId);
      expect(certificates[1].certificateId).toBe(firstResult.certificateId);
    });
  });

  describe('markCertificateDownloaded', () => {
    it('should mark certificate as downloaded', () => {
      const saveResult = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      const markResult = storage.markCertificateDownloaded(saveResult.certificateId!);
      expect(markResult).toBe(true);

      const retrieveResult = storage.getCertificateDataById(saveResult.certificateId!);
      expect(retrieveResult.data?.metadata.downloaded).toBe(true);
      expect(retrieveResult.data?.metadata.downloadedAt).toBeDefined();
    });

    it('should return false for non-existent certificate', () => {
      const result = storage.markCertificateDownloaded('non-existent-cert');
      expect(result).toBe(false);
    });
  });

  describe('invalidateCertificate', () => {
    it('should invalidate a certificate', () => {
      const saveResult = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      const invalidateResult = storage.invalidateCertificate(saveResult.certificateId!);
      expect(invalidateResult).toBe(true);

      const retrieveResult = storage.getCertificateDataById(saveResult.certificateId!);
      expect(retrieveResult.success).toBe(false);
      expect(retrieveResult.error).toContain('expired or is no longer valid');
    });
  });

  describe('clearCertificateData', () => {
    it('should clear all certificates for a session', () => {
      storage.saveCertificateData(
        mockSessionId,
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );
      storage.saveCertificateData(
        mockSessionId,
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      const clearedCount = storage.clearCertificateData(mockSessionId);
      expect(clearedCount).toBe(2);

      const retrieveResult = storage.getCertificateData(mockSessionId);
      expect(retrieveResult.success).toBe(false);
    });

    it('should return 0 for non-existent session', () => {
      const clearedCount = storage.clearCertificateData('non-existent-session');
      expect(clearedCount).toBe(0);
    });
  });

  describe('clearCertificateById', () => {
    it('should clear specific certificate', () => {
      const saveResult = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      const clearResult = storage.clearCertificateById(saveResult.certificateId!);
      expect(clearResult).toBe(true);

      const retrieveResult = storage.getCertificateDataById(saveResult.certificateId!);
      expect(retrieveResult.success).toBe(false);
    });
  });

  describe('cleanupExpiredCertificates', () => {
    it('should remove expired certificates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata,
        pastDate
      );

      const cleanedCount = storage.cleanupExpiredCertificates();
      expect(cleanedCount).toBe(1);
    });

    it('should not remove valid certificates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata,
        futureDate
      );

      const cleanedCount = storage.cleanupExpiredCertificates();
      expect(cleanedCount).toBe(0);
    });
  });

  describe('cleanupOldCertificates', () => {
    it('should remove certificates older than specified days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      // Manually set the storedAt date for testing
      const saveResult = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      // Modify the stored date (testing purposes only)
      const certs = (storage as any).loadAllCertificates();
      certs[saveResult.certificateId!].storedAt = oldDate;
      (storage as any).saveAllCertificates(certs);

      const cleanedCount = storage.cleanupOldCertificates(90);
      expect(cleanedCount).toBe(1);
    });
  });

  describe('updateCertificateUrl', () => {
    it('should update download URL', () => {
      const saveResult = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      const newUrl = 'https://example.com/new-certificate.pdf';
      const updateResult = storage.updateCertificateUrl(
        saveResult.certificateId!,
        newUrl
      );
      expect(updateResult).toBe(true);

      const retrieveResult = storage.getCertificateDataById(saveResult.certificateId!);
      expect(retrieveResult.data?.downloadUrl).toBe(newUrl);
    });

    it('should update expiry date', () => {
      const saveResult = storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata
      );

      const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const updateResult = storage.updateCertificateUrl(
        saveResult.certificateId!,
        'https://example.com/new.pdf',
        newExpiresAt
      );
      expect(updateResult).toBe(true);

      const retrieveResult = storage.getCertificateDataById(saveResult.certificateId!);
      expect(retrieveResult.data?.expiresAt?.getTime()).toBe(newExpiresAt.getTime());
    });
  });

  describe('getStorageStats', () => {
    it('should return correct statistics', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Valid certificate
      storage.saveCertificateData(
        mockSessionId,
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata,
        futureDate
      );

      // Expired certificate
      storage.saveCertificateData(
        'session-2',
        mockDownloadUrl,
        mockS3Uri,
        mockMetadata,
        pastDate
      );

      // Downloaded certificate
      const downloadedResult = storage.saveCertificateData(
        'session-3',
        mockDownloadUrl,
        mockS3Uri,
        { ...mockMetadata, downloaded: true }
      );

      const stats = storage.getStorageStats();

      expect(stats.total).toBe(3);
      expect(stats.valid).toBe(2); // futureDate and no expiry
      expect(stats.expired).toBe(1);
      expect(stats.downloaded).toBe(1);
    });
  });
});
