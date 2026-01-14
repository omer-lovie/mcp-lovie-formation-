/**
 * Certificate Review Workflow Integration Tests
 * End-to-end tests for the complete certificate review process
 * Feature 002: Complete workflow from generation to approval
 */

import { CertificateApiClient } from '../../src/services/certificate/api';
import { CertificateReviewServer, ServerEvent } from '../../src/services/certificate/server';
import { SessionStorage } from '../../src/services/session-storage';
import {
  CertificateGenerationRequest,
  CertificateGenerationResponse
} from '../../src/services/certificate/types';
import axios from 'axios';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Certificate Review Workflow Integration', () => {
  let apiClient: CertificateApiClient;
  let reviewServer: CertificateReviewServer;
  let sessionStorage: SessionStorage;
  let mockAxiosInstance: any;
  let testStorageDir: string;
  let originalHomeDir: any;

  const validRequest: CertificateGenerationRequest = {
    companyName: 'Integration Test Corp',
    registeredAgent: {
      name: 'John Smith',
      address: {
        street: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75001',
        county: 'Dallas County'
      }
    },
    incorporator: {
      name: 'Jane Doe',
      address: {
        street: '456 Oak Ave',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001'
      }
    },
    sharesAuthorized: '10000',
    parValue: '0.01'
  };

  const mockApiResponse: CertificateGenerationResponse = {
    success: true,
    certificateId: 'cert-integration-123',
    downloadUrl: 'https://s3.amazonaws.com/bucket/certificate.pdf?signature=xyz',
    s3Uri: 's3://bucket/certificate.pdf',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    metadata: {
      companyName: 'Integration Test Corp',
      generatedAt: new Date().toISOString(),
      fileSize: 102400,
      fileHash: 'integration-hash'
    }
  };

  beforeEach(() => {
    // Setup test storage directory
    testStorageDir = path.join(os.tmpdir(), `lovie-integration-${Date.now()}`);
    originalHomeDir = os.homedir;
    os.homedir = jest.fn(() => testStorageDir);

    // Mock axios
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      defaults: { headers: { common: {} } }
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedAxios.isAxiosError = jest.fn((error: any) => !!error.isAxiosError);

    // Initialize services
    apiClient = new CertificateApiClient();
    reviewServer = new CertificateReviewServer();
    sessionStorage = new SessionStorage();

    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup
    if (reviewServer.getIsRunning()) {
      await reviewServer.stop();
    }

    os.homedir = originalHomeDir;

    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  describe('Happy path: Complete approval workflow', () => {
    it('should complete full workflow from generation to storage', async () => {
      // Step 1: Generate certificate via API
      mockAxiosInstance.post.mockResolvedValue({ data: mockApiResponse });

      const apiResponse = await apiClient.generateCertificate(validRequest);

      expect(apiResponse.success).toBe(true);
      expect(apiResponse.certificateId).toBe('cert-integration-123');
      expect(apiResponse.downloadUrl).toBeDefined();

      // Step 2: Start review server
      await reviewServer.start(apiResponse.downloadUrl, validRequest.companyName);

      expect(reviewServer.getIsRunning()).toBe(true);
      expect(reviewServer.getUrl()).toMatch(/^http:\/\/localhost:\d+$/);

      // Step 3: Simulate user approval
      const approvalPromise = new Promise<void>((resolve) => {
        reviewServer.once(ServerEvent.APPROVED, resolve);
      });

      // Trigger approval (simulating user click)
      reviewServer.emit(ServerEvent.APPROVED);
      await approvalPromise;

      // Step 4: Save certificate data to storage
      const saveResult = sessionStorage.saveCertificateData(
        'session-integration-123',
        apiResponse.downloadUrl,
        apiResponse.s3Uri,
        {
          companyName: apiResponse.metadata.companyName,
          generatedAt: new Date(apiResponse.metadata.generatedAt),
          fileSize: apiResponse.metadata.fileSize,
          fileHash: apiResponse.metadata.fileHash,
          downloaded: false
        },
        new Date(apiResponse.expiresAt)
      );

      expect(saveResult.success).toBe(true);
      expect(saveResult.certificateId).toBeDefined();

      // Step 5: Verify stored data
      const retrieved = sessionStorage.getCertificateData('session-integration-123');

      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.downloadUrl).toBe(apiResponse.downloadUrl);
      expect(retrieved.data?.s3Uri).toBe(apiResponse.s3Uri);
      expect(retrieved.data?.metadata.companyName).toBe('Integration Test Corp');
    });

    it('should handle multiple certificate generation and approval cycles', async () => {
      const iterations = 3;

      for (let i = 0; i < iterations; i++) {
        const response = {
          ...mockApiResponse,
          certificateId: `cert-iteration-${i}`,
          downloadUrl: `https://s3.amazonaws.com/bucket/cert-${i}.pdf`
        };

        mockAxiosInstance.post.mockResolvedValue({ data: response });

        const apiResponse = await apiClient.generateCertificate(validRequest);
        expect(apiResponse.success).toBe(true);

        const saveResult = sessionStorage.saveCertificateData(
          `session-${i}`,
          apiResponse.downloadUrl,
          apiResponse.s3Uri,
          {
            companyName: apiResponse.metadata.companyName,
            generatedAt: new Date(apiResponse.metadata.generatedAt),
            fileSize: apiResponse.metadata.fileSize,
            fileHash: apiResponse.metadata.fileHash,
            downloaded: false
          }
        );

        expect(saveResult.success).toBe(true);
      }

      // Verify all certificates were stored
      const stats = sessionStorage.getStorageStats();
      expect(stats.total).toBe(iterations);
      expect(stats.valid).toBe(iterations);
    });
  });

  describe('User cancellation workflow', () => {
    it('should handle user cancellation gracefully', async () => {
      // Generate certificate
      mockAxiosInstance.post.mockResolvedValue({ data: mockApiResponse });
      const apiResponse = await apiClient.generateCertificate(validRequest);

      // Start review server
      await reviewServer.start(apiResponse.downloadUrl, validRequest.companyName);

      // Simulate user cancellation
      const cancellationPromise = new Promise<void>((resolve) => {
        reviewServer.once(ServerEvent.CANCELLED, resolve);
      });

      reviewServer.emit(ServerEvent.CANCELLED);
      await cancellationPromise;

      // Verify server stopped
      expect(reviewServer.getIsRunning()).toBe(false);

      // Verify no certificate was saved
      const retrieved = sessionStorage.getCertificateData('session-cancelled');
      expect(retrieved.success).toBe(false);
    });

    it('should allow regeneration after cancellation', async () => {
      // First attempt - cancelled
      mockAxiosInstance.post.mockResolvedValue({ data: mockApiResponse });
      await apiClient.generateCertificate(validRequest);

      const server1 = new CertificateReviewServer();
      await server1.start(mockApiResponse.downloadUrl, validRequest.companyName);

      const cancellationPromise = new Promise<void>((resolve) => {
        server1.once(ServerEvent.CANCELLED, resolve);
      });

      server1.emit(ServerEvent.CANCELLED);
      await cancellationPromise;

      // Second attempt - approved
      const newResponse = {
        ...mockApiResponse,
        certificateId: 'cert-retry-123',
        downloadUrl: 'https://s3.amazonaws.com/bucket/retry.pdf'
      };

      mockAxiosInstance.post.mockResolvedValue({ data: newResponse });
      const apiResponse = await apiClient.generateCertificate(validRequest);

      const server2 = new CertificateReviewServer();
      await server2.start(apiResponse.downloadUrl, validRequest.companyName);

      expect(server2.getIsRunning()).toBe(true);

      await server2.stop();
    });
  });

  describe('Error handling workflows', () => {
    it('should handle API timeout during generation', async () => {
      const timeoutError = {
        isAxiosError: true,
        code: 'ETIMEDOUT',
        message: 'timeout exceeded'
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockAxiosInstance.post.mockRejectedValue(timeoutError);

      await expect(apiClient.generateCertificate(validRequest)).rejects.toThrow(
        'Certificate generation service timed out'
      );

      // Verify no storage occurred
      const stats = sessionStorage.getStorageStats();
      expect(stats.total).toBe(0);
    });

    it('should handle server startup failure', async () => {
      // Create multiple servers to exhaust port range
      const servers: CertificateReviewServer[] = [];

      try {
        for (let i = 0; i < 12; i++) {
          const server = new CertificateReviewServer();
          await server.start(mockApiResponse.downloadUrl, validRequest.companyName);
          servers.push(server);
        }

        // Should fail after max attempts
        fail('Should have thrown port exhaustion error');
      } catch (error: any) {
        expect(error.message).toContain('No available ports found');
      } finally {
        // Cleanup
        for (const server of servers) {
          if (server.getIsRunning()) {
            await server.stop();
          }
        }
      }
    });

    it('should handle invalid API response', async () => {
      const invalidResponse = {
        ...mockApiResponse,
        success: false,
        certificateId: ''
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(apiClient.generateCertificate(validRequest)).rejects.toThrow(
        'Invalid API response'
      );
    });

    it('should handle storage write failure', () => {
      // Make directory read-only
      const certDir = path.join(testStorageDir, '.lovie', 'certificates');
      fs.mkdirSync(certDir, { recursive: true });
      fs.chmodSync(certDir, 0o444);

      const result = sessionStorage.saveCertificateData(
        'session-fail',
        mockApiResponse.downloadUrl,
        mockApiResponse.s3Uri,
        {
          companyName: mockApiResponse.metadata.companyName,
          generatedAt: new Date(),
          fileSize: mockApiResponse.metadata.fileSize,
          fileHash: mockApiResponse.metadata.fileHash,
          downloaded: false
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore permissions
      fs.chmodSync(certDir, 0o755);
    });
  });

  describe('URL expiration workflow', () => {
    it('should detect expired download URL', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockApiResponse });
      const apiResponse = await apiClient.generateCertificate(validRequest);

      // Check URL is not expired initially
      expect(apiClient.isUrlExpired(apiResponse.expiresAt)).toBe(false);

      // Simulate expiration
      const pastDate = new Date(Date.now() - 3600000);
      expect(apiClient.isUrlExpired(pastDate)).toBe(true);
    });

    it('should warn about expiring URLs', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: mockApiResponse });
      const apiResponse = await apiClient.generateCertificate(validRequest);

      const minutesRemaining = apiClient.getMinutesRemaining(apiResponse.expiresAt);

      expect(minutesRemaining).toBeGreaterThan(0);
      expect(minutesRemaining).toBeLessThanOrEqual(60);
    });

    it('should handle expired certificate in storage', async () => {
      const pastDate = new Date(Date.now() - 3600000);

      const saveResult = sessionStorage.saveCertificateData(
        'session-expired',
        'https://expired-url.com/cert.pdf',
        's3://bucket/cert.pdf',
        {
          companyName: 'Test Corp',
          generatedAt: new Date(),
          fileSize: 100,
          fileHash: 'hash',
          downloaded: false
        },
        pastDate
      );

      expect(saveResult.success).toBe(true);

      // Try to retrieve expired certificate
      const retrieved = sessionStorage.getCertificateData('session-expired');

      expect(retrieved.success).toBe(false);
      expect(retrieved.error).toContain('expired');
    });

    it('should support URL refresh for expired certificates', async () => {
      const pastDate = new Date(Date.now() - 3600000);

      const saveResult = sessionStorage.saveCertificateData(
        'session-refresh',
        'https://old-url.com/cert.pdf',
        's3://bucket/cert.pdf',
        {
          companyName: 'Test Corp',
          generatedAt: new Date(),
          fileSize: 100,
          fileHash: 'hash',
          downloaded: false
        },
        pastDate
      );

      // Refresh URL
      const newUrl = 'https://new-url.com/cert.pdf';
      const newExpiry = new Date(Date.now() + 3600000);

      const updated = sessionStorage.updateCertificateUrl(saveResult.certificateId!, newUrl, newExpiry);

      expect(updated).toBe(true);

      // Verify certificate is now accessible
      const retrieved = sessionStorage.getCertificateDataById(saveResult.certificateId!);

      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.downloadUrl).toBe(newUrl);
    });
  });

  describe('Concurrent workflow scenarios', () => {
    it('should handle multiple concurrent sessions', async () => {
      const sessions = ['session-1', 'session-2', 'session-3'];

      const promises = sessions.map(async (sessionId, index) => {
        const response = {
          ...mockApiResponse,
          certificateId: `cert-concurrent-${index}`,
          downloadUrl: `https://s3.amazonaws.com/bucket/cert-${index}.pdf`
        };

        mockAxiosInstance.post.mockResolvedValue({ data: response });

        const apiResponse = await apiClient.generateCertificate(validRequest);

        return sessionStorage.saveCertificateData(
          sessionId,
          apiResponse.downloadUrl,
          apiResponse.s3Uri,
          {
            companyName: apiResponse.metadata.companyName,
            generatedAt: new Date(apiResponse.metadata.generatedAt),
            fileSize: apiResponse.metadata.fileSize,
            fileHash: apiResponse.metadata.fileHash,
            downloaded: false
          }
        );
      });

      const results = await Promise.all(promises);

      // Verify all succeeded
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.certificateId).toBeDefined();
      });

      // Verify storage stats
      const stats = sessionStorage.getStorageStats();
      expect(stats.total).toBe(sessions.length);
      expect(stats.valid).toBe(sessions.length);
    });

    it('should handle rapid approval/cancellation events', async () => {
      const iterations = 5;

      for (let i = 0; i < iterations; i++) {
        const server = new CertificateReviewServer();
        await server.start(mockApiResponse.downloadUrl, validRequest.companyName);

        const event = i % 2 === 0 ? ServerEvent.APPROVED : ServerEvent.CANCELLED;

        const eventPromise = new Promise<void>((resolve) => {
          server.once(event, resolve);
        });

        server.emit(event);
        await eventPromise;

        expect(server.getIsRunning()).toBe(false);
      }
    });
  });

  describe('Data persistence and recovery', () => {
    it('should persist certificate data across storage instances', () => {
      const storage1 = new SessionStorage();

      const saveResult = storage1.saveCertificateData(
        'session-persist',
        mockApiResponse.downloadUrl,
        mockApiResponse.s3Uri,
        {
          companyName: mockApiResponse.metadata.companyName,
          generatedAt: new Date(mockApiResponse.metadata.generatedAt),
          fileSize: mockApiResponse.metadata.fileSize,
          fileHash: mockApiResponse.metadata.fileHash,
          downloaded: false
        }
      );

      expect(saveResult.success).toBe(true);

      // Create new storage instance
      const storage2 = new SessionStorage();
      const retrieved = storage2.getCertificateData('session-persist');

      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.downloadUrl).toBe(mockApiResponse.downloadUrl);
    });

    it('should cleanup expired certificates automatically', () => {
      const pastDate = new Date(Date.now() - 7200000);

      sessionStorage.saveCertificateData(
        'session-cleanup-1',
        'https://expired1.com/cert.pdf',
        's3://bucket/cert1.pdf',
        {
          companyName: 'Expired Corp 1',
          generatedAt: new Date(),
          fileSize: 100,
          fileHash: 'hash1',
          downloaded: false
        },
        pastDate
      );

      sessionStorage.saveCertificateData(
        'session-cleanup-2',
        'https://valid.com/cert.pdf',
        's3://bucket/cert2.pdf',
        {
          companyName: 'Valid Corp',
          generatedAt: new Date(),
          fileSize: 200,
          fileHash: 'hash2',
          downloaded: false
        }
      );

      const cleaned = sessionStorage.cleanupExpiredCertificates();

      expect(cleaned).toBe(1);

      const stats = sessionStorage.getStorageStats();
      expect(stats.total).toBe(1);
      expect(stats.valid).toBe(1);
    });

    it('should maintain data integrity across multiple operations', async () => {
      const sessionId = 'session-integrity';

      // Multiple saves
      for (let i = 0; i < 5; i++) {
        sessionStorage.saveCertificateData(
          sessionId,
          `https://example.com/cert-${i}.pdf`,
          `s3://bucket/cert-${i}.pdf`,
          {
            companyName: `Corp ${i}`,
            generatedAt: new Date(),
            fileSize: 100 * i,
            fileHash: `hash-${i}`,
            downloaded: false
          }
        );
      }

      // Retrieve all
      const certificates = sessionStorage.getAllCertificatesForSession(sessionId);
      expect(certificates).toHaveLength(5);

      // Clear specific ones
      sessionStorage.clearCertificateById(certificates[0].certificateId);
      sessionStorage.clearCertificateById(certificates[1].certificateId);

      // Verify remaining
      const remaining = sessionStorage.getAllCertificatesForSession(sessionId);
      expect(remaining).toHaveLength(3);

      // Clear all
      const cleared = sessionStorage.clearCertificateData(sessionId);
      expect(cleared).toBe(3);

      // Verify empty
      const final = sessionStorage.getAllCertificatesForSession(sessionId);
      expect(final).toHaveLength(0);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very long company names', async () => {
      const longName = 'A'.repeat(500);
      const longRequest = { ...validRequest, companyName: longName };

      mockAxiosInstance.post.mockResolvedValue({
        data: { ...mockApiResponse, metadata: { ...mockApiResponse.metadata, companyName: longName } }
      });

      const response = await apiClient.generateCertificate(longRequest);

      expect(response.success).toBe(true);

      await reviewServer.start(response.downloadUrl, longName);
      expect(reviewServer.getIsRunning()).toBe(true);

      await reviewServer.stop();
    });

    it('should handle special characters in company names', async () => {
      const specialName = "Test & Co., LLC <script>alert('xss')</script>";
      const specialRequest = { ...validRequest, companyName: specialName };

      mockAxiosInstance.post.mockResolvedValue({ data: mockApiResponse });

      const response = await apiClient.generateCertificate(specialRequest);

      await reviewServer.start(response.downloadUrl, specialName);

      expect(reviewServer.getIsRunning()).toBe(true);

      await reviewServer.stop();
    });

    it('should handle minimum and maximum timeout values', () => {
      const clientMin = new CertificateApiClient({ baseUrl: 'http://test.com', timeout: 1 });
      const clientMax = new CertificateApiClient({ baseUrl: 'http://test.com', timeout: 999999 });

      expect(clientMin).toBeDefined();
      expect(clientMax).toBeDefined();
    });

    it('should handle zero-byte file size in metadata', () => {
      const result = sessionStorage.saveCertificateData(
        'session-zero',
        'https://example.com/cert.pdf',
        's3://bucket/cert.pdf',
        {
          companyName: 'Test',
          generatedAt: new Date(),
          fileSize: 0,
          fileHash: 'hash',
          downloaded: false
        }
      );

      expect(result.success).toBe(true);

      const retrieved = sessionStorage.getCertificateData('session-zero');
      expect(retrieved.success).toBe(true);
      expect(retrieved.data?.metadata.fileSize).toBe(0);
    });
  });
});
