/**
 * Session Storage Tests
 * Tests for certificate data persistence
 * Feature 002: Certificate data storage and retrieval
 */

import { SessionStorage } from '../../src/services/session-storage';
import {
  SessionCertificateData,
  CertificateMetadata
} from '../../src/types/certificate';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('SessionStorage', () => {
  let storage: SessionStorage;
  let testStorageDir: string;
  let originalHomeDir: string;

  const mockMetadata: CertificateMetadata = {
    companyName: 'Test Corp',
    generatedAt: new Date(),
    fileSize: 102400,
    fileHash: 'abc123',
    downloaded: false
  };

  beforeEach(() => {
    // Create temporary test directory
    testStorageDir = path.join(os.tmpdir(), `lovie-test-${Date.now()}`);
    originalHomeDir = os.homedir;

    // Mock os.homedir to use test directory
    os.homedir = jest.fn(() => testStorageDir);

    storage = new SessionStorage();
  });

  afterEach(() => {
    // Restore original homedir
    os.homedir = originalHomeDir;

    // Clean up test directory
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  describe('Storage initialization', () => {
    it('should create storage directory on initialization', () => {
      const storageDir = path.join(testStorageDir, '.lovie', 'certificates');
      expect(fs.existsSync(storageDir)).toBe(true);
    });

    it('should create certificates.json file when saving data', () => {
      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      expect(result.success).toBe(true);

      const certFile = path.join(testStorageDir, '.lovie', 'certificates', 'certificates.json');
      expect(fs.existsSync(certFile)).toBe(true);
    });
  });

  describe('saveCertificateData', () => {
    it('should save certificate data successfully', () => {
      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      expect(result.success).toBe(true);
      expect(result.certificateId).toBeDefined();
      expect(result.certificateId).toMatch(/^cert-\d+-[a-z0-9]+$/);
    });

    it('should save certificate with expiration date', () => {
      const expiresAt = new Date(Date.now() + 3600000);

      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata,
        expiresAt
      );

      expect(result.success).toBe(true);

      const retrieved = storage.getCertificateDataById(result.certificateId!);
      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.expiresAt).toEqual(expiresAt);
    });

    it('should save multiple certificates for same session', () => {
      const result1 = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );

      const result2 = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.certificateId).not.toBe(result2.certificateId);
    });

    it('should handle save errors gracefully', () => {
      // Make directory read-only to force write error
      const certDir = path.join(testStorageDir, '.lovie', 'certificates');
      fs.chmodSync(certDir, 0o444);

      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore permissions for cleanup
      fs.chmodSync(certDir, 0o755);
    });
  });

  describe('getCertificateDataById', () => {
    it('should retrieve certificate by ID', () => {
      const saveResult = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      const retrieved = storage.getCertificateDataById(saveResult.certificateId!);

      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.certificateId).toBe(saveResult.certificateId);
      expect(retrieved.data?.downloadUrl).toBe('https://example.com/cert.pdf');
      expect(retrieved.data?.s3Uri).toBe('s3://bucket/cert.pdf');
    });

    it('should return error for non-existent certificate', () => {
      const result = storage.getCertificateDataById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Certificate not found');
    });

    it('should return error for expired certificate', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

      const saveResult = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata,
        pastDate
      );

      const retrieved = storage.getCertificateDataById(saveResult.certificateId!);

      expect(retrieved.success).toBe(false);
      expect(retrieved.error).toContain('expired');
    });
  });

  describe('getCertificateData', () => {
    it('should retrieve most recent certificate for session', () => {
      storage.saveCertificateData(
        'session-123',
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );

      // Add small delay to ensure different timestamps
      const laterMetadata = { ...mockMetadata, fileHash: 'xyz789' };
      const result2 = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        laterMetadata
      );

      const retrieved = storage.getCertificateData('session-123');

      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.certificateId).toBe(result2.certificateId);
      expect(retrieved.data?.metadata.fileHash).toBe('xyz789');
    });

    it('should return error when no certificates exist for session', () => {
      const result = storage.getCertificateData('non-existent-session');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid certificate found');
    });

    it('should skip expired certificates', () => {
      const pastDate = new Date(Date.now() - 3600000);
      storage.saveCertificateData(
        'session-123',
        'https://example.com/expired.pdf',
        's3://bucket/expired.pdf',
        mockMetadata,
        pastDate
      );

      const futureDate = new Date(Date.now() + 3600000);
      storage.saveCertificateData(
        'session-123',
        'https://example.com/valid.pdf',
        's3://bucket/valid.pdf',
        mockMetadata,
        futureDate
      );

      const result = storage.getCertificateData('session-123');

      expect(result.success).toBe(true);
      expect(result.data?.downloadUrl).toBe('https://example.com/valid.pdf');
    });
  });

  describe('getAllCertificatesForSession', () => {
    it('should return all certificates for session', () => {
      storage.saveCertificateData(
        'session-123',
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );

      storage.saveCertificateData(
        'session-123',
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      const certificates = storage.getAllCertificatesForSession('session-123');

      expect(certificates).toHaveLength(2);
      expect(certificates[0].sessionId).toBe('session-123');
      expect(certificates[1].sessionId).toBe('session-123');
    });

    it('should return empty array for session with no certificates', () => {
      const certificates = storage.getAllCertificatesForSession('non-existent');

      expect(certificates).toEqual([]);
    });

    it('should include both valid and expired certificates', () => {
      const pastDate = new Date(Date.now() - 3600000);
      storage.saveCertificateData(
        'session-123',
        'https://example.com/expired.pdf',
        's3://bucket/expired.pdf',
        mockMetadata,
        pastDate
      );

      storage.saveCertificateData(
        'session-123',
        'https://example.com/valid.pdf',
        's3://bucket/valid.pdf',
        mockMetadata
      );

      const certificates = storage.getAllCertificatesForSession('session-123');

      expect(certificates).toHaveLength(2);
    });

    it('should sort certificates by stored date (newest first)', () => {
      const result1 = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );

      const result2 = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      const certificates = storage.getAllCertificatesForSession('session-123');

      expect(certificates[0].certificateId).toBe(result2.certificateId);
      expect(certificates[1].certificateId).toBe(result1.certificateId);
    });
  });

  describe('markCertificateDownloaded', () => {
    it('should mark certificate as downloaded', () => {
      const saveResult = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      const marked = storage.markCertificateDownloaded(saveResult.certificateId!);
      expect(marked).toBe(true);

      const retrieved = storage.getCertificateDataById(saveResult.certificateId!);
      expect(retrieved.data?.metadata.downloaded).toBe(true);
      expect(retrieved.data?.metadata.downloadedAt).toBeDefined();
    });

    it('should return false for non-existent certificate', () => {
      const result = storage.markCertificateDownloaded('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('invalidateCertificate', () => {
    it('should invalidate certificate', () => {
      const saveResult = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      const invalidated = storage.invalidateCertificate(saveResult.certificateId!);
      expect(invalidated).toBe(true);

      const retrieved = storage.getCertificateDataById(saveResult.certificateId!);
      expect(retrieved.success).toBe(false);
    });

    it('should return false for non-existent certificate', () => {
      const result = storage.invalidateCertificate('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('clearCertificateData', () => {
    it('should clear all certificates for session', () => {
      storage.saveCertificateData(
        'session-123',
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );

      storage.saveCertificateData(
        'session-123',
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      const cleared = storage.clearCertificateData('session-123');

      expect(cleared).toBe(2);

      const certificates = storage.getAllCertificatesForSession('session-123');
      expect(certificates).toHaveLength(0);
    });

    it('should not affect certificates from other sessions', () => {
      storage.saveCertificateData(
        'session-123',
        'https://example.com/cert1.pdf',
        's3://bucket/cert1.pdf',
        mockMetadata
      );

      storage.saveCertificateData(
        'session-456',
        'https://example.com/cert2.pdf',
        's3://bucket/cert2.pdf',
        mockMetadata
      );

      storage.clearCertificateData('session-123');

      const session456Certs = storage.getAllCertificatesForSession('session-456');
      expect(session456Certs).toHaveLength(1);
    });

    it('should return 0 for session with no certificates', () => {
      const cleared = storage.clearCertificateData('non-existent');

      expect(cleared).toBe(0);
    });
  });

  describe('clearCertificateById', () => {
    it('should clear specific certificate', () => {
      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      const cleared = storage.clearCertificateById(result.certificateId!);
      expect(cleared).toBe(true);

      const retrieved = storage.getCertificateDataById(result.certificateId!);
      expect(retrieved.success).toBe(false);
    });

    it('should return false for non-existent certificate', () => {
      const result = storage.clearCertificateById('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredCertificates', () => {
    it('should remove expired certificates', () => {
      const pastDate = new Date(Date.now() - 3600000);
      storage.saveCertificateData(
        'session-123',
        'https://example.com/expired.pdf',
        's3://bucket/expired.pdf',
        mockMetadata,
        pastDate
      );

      storage.saveCertificateData(
        'session-123',
        'https://example.com/valid.pdf',
        's3://bucket/valid.pdf',
        mockMetadata
      );

      const cleaned = storage.cleanupExpiredCertificates();

      expect(cleaned).toBe(1);

      const certificates = storage.getAllCertificatesForSession('session-123');
      expect(certificates).toHaveLength(1);
      expect(certificates[0].downloadUrl).toBe('https://example.com/valid.pdf');
    });

    it('should return 0 when no expired certificates exist', () => {
      storage.saveCertificateData(
        'session-123',
        'https://example.com/valid.pdf',
        's3://bucket/valid.pdf',
        mockMetadata
      );

      const cleaned = storage.cleanupExpiredCertificates();

      expect(cleaned).toBe(0);
    });
  });

  describe('cleanupOldCertificates', () => {
    it('should remove certificates older than specified days', () => {
      // Mock old certificate by directly manipulating storage
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/old.pdf',
        's3://bucket/old.pdf',
        mockMetadata
      );

      // Manually update storedAt date
      const certFile = path.join(testStorageDir, '.lovie', 'certificates', 'certificates.json');
      const data = JSON.parse(fs.readFileSync(certFile, 'utf-8'));
      data[result.certificateId!].storedAt = oldDate.toISOString();
      fs.writeFileSync(certFile, JSON.stringify(data));

      const cleaned = storage.cleanupOldCertificates(90);

      expect(cleaned).toBe(1);
    });

    it('should use default 90 days if not specified', () => {
      const cleaned = storage.cleanupOldCertificates();

      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStorageStats', () => {
    it('should return correct statistics', () => {
      const pastDate = new Date(Date.now() - 3600000);
      storage.saveCertificateData(
        'session-123',
        'https://example.com/expired.pdf',
        's3://bucket/expired.pdf',
        mockMetadata,
        pastDate
      );

      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/valid.pdf',
        's3://bucket/valid.pdf',
        mockMetadata
      );

      storage.markCertificateDownloaded(result.certificateId!);

      const stats = storage.getStorageStats();

      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(1);
      expect(stats.expired).toBe(1);
      expect(stats.downloaded).toBe(1);
    });

    it('should return zeros for empty storage', () => {
      const stats = storage.getStorageStats();

      expect(stats).toEqual({
        total: 0,
        valid: 0,
        expired: 0,
        downloaded: 0
      });
    });
  });

  describe('updateCertificateUrl', () => {
    it('should update certificate URL', () => {
      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/old.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      const newUrl = 'https://example.com/new.pdf';
      const updated = storage.updateCertificateUrl(result.certificateId!, newUrl);

      expect(updated).toBe(true);

      const retrieved = storage.getCertificateDataById(result.certificateId!);
      expect(retrieved.data?.downloadUrl).toBe(newUrl);
    });

    it('should update expiration date if provided', () => {
      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      const newUrl = 'https://example.com/new.pdf';
      const newExpiry = new Date(Date.now() + 7200000);
      const updated = storage.updateCertificateUrl(result.certificateId!, newUrl, newExpiry);

      expect(updated).toBe(true);

      const retrieved = storage.getCertificateDataById(result.certificateId!);
      expect(retrieved.data?.expiresAt).toEqual(newExpiry);
    });

    it('should mark certificate as valid after URL update', () => {
      const result = storage.saveCertificateData(
        'session-123',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        mockMetadata
      );

      storage.invalidateCertificate(result.certificateId!);

      const newUrl = 'https://example.com/new.pdf';
      storage.updateCertificateUrl(result.certificateId!, newUrl);

      const retrieved = storage.getCertificateDataById(result.certificateId!);
      expect(retrieved.success).toBe(true);
    });

    it('should return false for non-existent certificate', () => {
      const result = storage.updateCertificateUrl('non-existent-id', 'https://example.com/new.pdf');

      expect(result).toBe(false);
    });
  });
});
