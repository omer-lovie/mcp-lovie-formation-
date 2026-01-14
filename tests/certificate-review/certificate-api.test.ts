/**
 * Certificate API Client Tests
 * Tests for certificate generation API communication
 * Feature 002: FR-001, FR-002, FR-003
 */

import { CertificateApiClient } from '../../src/services/certificate/api';
import {
  CertificateGenerationRequest,
  CertificateGenerationResponse
} from '../../src/services/certificate/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CertificateApiClient', () => {
  let client: CertificateApiClient;
  let mockAxiosInstance: any;

  const validRequest: CertificateGenerationRequest = {
    companyName: 'Test Corp',
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

  const validResponse: CertificateGenerationResponse = {
    success: true,
    certificateId: 'cert-123',
    downloadUrl: 'https://s3.amazonaws.com/bucket/certificate.pdf?signature=xyz',
    s3Uri: 's3://bucket/certificate.pdf',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    metadata: {
      companyName: 'Test Corp',
      generatedAt: new Date().toISOString(),
      fileSize: 102400,
      fileHash: 'abc123'
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock axios.create to return our mock instance
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      defaults: { headers: { common: {} } }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedAxios.isAxiosError = jest.fn((error: any) => !!error.isAxiosError);

    // Create client
    client = new CertificateApiClient();
  });

  describe('Constructor', () => {
    it('should create client with default config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://helpful-beauty-production.up.railway.app/api/v1',
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should create client with custom config', () => {
      const customConfig = {
        baseUrl: 'https://custom-api.example.com',
        timeout: 60000
      };

      new CertificateApiClient(customConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: customConfig.baseUrl,
          timeout: customConfig.timeout
        })
      );
    });
  });

  describe('generateCertificate', () => {
    describe('Success scenarios', () => {
      it('should generate certificate with valid request', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

        const result = await client.generateCertificate(validRequest);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/certificates', validRequest);
        expect(result).toEqual(validResponse);
      });

      it('should handle minimal valid request', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

        const minimalRequest = { ...validRequest };
        const result = await client.generateCertificate(minimalRequest);

        expect(result.success).toBe(true);
        expect(result.certificateId).toBeDefined();
        expect(result.downloadUrl).toBeDefined();
      });
    });

    describe('Request validation', () => {
      it('should reject request without company name', async () => {
        const invalidRequest = { ...validRequest, companyName: '' };

        await expect(client.generateCertificate(invalidRequest)).rejects.toThrow(
          'Invalid certificate request: Company name is required'
        );
      });

      it('should reject request without registered agent name', async () => {
        const invalidRequest = {
          ...validRequest,
          registeredAgent: { ...validRequest.registeredAgent, name: '' }
        };

        await expect(client.generateCertificate(invalidRequest)).rejects.toThrow(
          'Registered agent name is required'
        );
      });

      it('should reject request without registered agent address', async () => {
        const invalidRequest = {
          ...validRequest,
          registeredAgent: { ...validRequest.registeredAgent, address: undefined as any }
        };

        await expect(client.generateCertificate(invalidRequest)).rejects.toThrow(
          'Registered agent address is required'
        );
      });

      it('should reject request with incomplete registered agent address', async () => {
        const invalidRequest = {
          ...validRequest,
          registeredAgent: {
            ...validRequest.registeredAgent,
            address: { ...validRequest.registeredAgent.address, street: '' }
          }
        };

        await expect(client.generateCertificate(invalidRequest)).rejects.toThrow(
          'Registered agent street is required'
        );
      });

      it('should reject request without incorporator name', async () => {
        const invalidRequest = {
          ...validRequest,
          incorporator: { ...validRequest.incorporator, name: '' }
        };

        await expect(client.generateCertificate(invalidRequest)).rejects.toThrow(
          'Incorporator name is required'
        );
      });

      it('should reject request without shares authorized', async () => {
        const invalidRequest = { ...validRequest, sharesAuthorized: '' };

        await expect(client.generateCertificate(invalidRequest)).rejects.toThrow(
          'Shares authorized is required'
        );
      });

      it('should reject request without par value', async () => {
        const invalidRequest = { ...validRequest, parValue: '' };

        await expect(client.generateCertificate(invalidRequest)).rejects.toThrow(
          'Par value is required'
        );
      });
    });

    describe('Response validation', () => {
      it('should reject response without success flag', async () => {
        const invalidResponse = { ...validResponse, success: false };
        mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'API returned success=false'
        );
      });

      it('should reject response without certificateId', async () => {
        const invalidResponse = { ...validResponse, certificateId: '' };
        mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Missing certificateId'
        );
      });

      it('should reject response without downloadUrl', async () => {
        const invalidResponse = { ...validResponse, downloadUrl: '' };
        mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Missing downloadUrl'
        );
      });

      it('should reject response without metadata', async () => {
        const invalidResponse = { ...validResponse, metadata: undefined as any };
        mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Missing metadata'
        );
      });
    });

    describe('Network errors', () => {
      it('should handle timeout error', async () => {
        const error = {
          isAxiosError: true,
          code: 'ETIMEDOUT',
          message: 'timeout of 30000ms exceeded'
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Certificate generation service timed out'
        );
      });

      it('should handle connection refused error', async () => {
        const error = {
          isAxiosError: true,
          code: 'ECONNREFUSED',
          message: 'connect ECONNREFUSED'
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Unable to connect to certificate generation service'
        );
      });

      it('should handle DNS error', async () => {
        const error = {
          isAxiosError: true,
          code: 'ENOTFOUND',
          message: 'getaddrinfo ENOTFOUND'
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Unable to connect to certificate generation service'
        );
      });
    });

    describe('HTTP errors', () => {
      it('should handle 400 Bad Request', async () => {
        const error = {
          isAxiosError: true,
          response: {
            status: 400,
            data: { message: 'Invalid data format' }
          }
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Invalid request data: Invalid data format'
        );
      });

      it('should handle 401 Unauthorized', async () => {
        const error = {
          isAxiosError: true,
          response: { status: 401, data: {} }
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Authentication failed'
        );
      });

      it('should handle 404 Not Found', async () => {
        const error = {
          isAxiosError: true,
          response: { status: 404, data: {} }
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Certificate generation endpoint not found'
        );
      });

      it('should handle 429 Too Many Requests', async () => {
        const error = {
          isAxiosError: true,
          response: { status: 429, data: {} }
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Too many requests'
        );
      });

      it('should handle 500 Server Error', async () => {
        const error = {
          isAxiosError: true,
          response: { status: 500, data: {} }
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'Certificate generation service is temporarily unavailable'
        );
      });

      it('should handle generic HTTP error', async () => {
        const error = {
          isAxiosError: true,
          response: {
            status: 418,
            data: { message: "I'm a teapot" }
          }
        };
        mockedAxios.isAxiosError.mockReturnValue(true);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          "Certificate generation failed: I'm a teapot"
        );
      });
    });

    describe('Generic errors', () => {
      it('should handle non-Axios errors', async () => {
        const error = new Error('Unknown error');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(client.generateCertificate(validRequest)).rejects.toThrow('Unknown error');
      });

      it('should handle non-Error objects', async () => {
        mockAxiosInstance.post.mockRejectedValue('string error');

        await expect(client.generateCertificate(validRequest)).rejects.toThrow(
          'An unexpected error occurred during certificate generation'
        );
      });
    });
  });

  describe('isUrlExpired', () => {
    it('should return false for non-expired URL', () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      expect(client.isUrlExpired(futureDate)).toBe(false);
    });

    it('should return true for expired URL', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      expect(client.isUrlExpired(pastDate)).toBe(true);
    });

    it('should return true for current timestamp', () => {
      const now = new Date();
      // Add small delay to ensure it's expired
      expect(client.isUrlExpired(now)).toBe(true);
    });

    it('should handle ISO string dates', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      expect(client.isUrlExpired(futureDate)).toBe(false);
    });
  });

  describe('getMinutesRemaining', () => {
    it('should calculate minutes remaining correctly', () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const minutes = client.getMinutesRemaining(futureDate);
      expect(minutes).toBe(30);
    });

    it('should return 0 for expired URL', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      expect(client.getMinutesRemaining(pastDate)).toBe(0);
    });

    it('should round down partial minutes', () => {
      const futureDate = new Date(Date.now() + 90 * 1000); // 90 seconds = 1.5 minutes
      const minutes = client.getMinutesRemaining(futureDate);
      expect(minutes).toBe(1);
    });

    it('should handle ISO string dates', () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const minutes = client.getMinutesRemaining(futureDate);
      expect(minutes).toBe(15);
    });

    it('should return 0 for current timestamp', () => {
      const now = new Date();
      expect(client.getMinutesRemaining(now)).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large timeout values', () => {
      const largeTimeout = 999999999;
      new CertificateApiClient({ baseUrl: 'http://test.com', timeout: largeTimeout });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: largeTimeout
        })
      );
    });

    it('should handle whitespace-only company name', async () => {
      const invalidRequest = { ...validRequest, companyName: '   ' };

      await expect(client.generateCertificate(invalidRequest)).rejects.toThrow(
        'Company name is required'
      );
    });

    it('should handle special characters in company name', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const specialRequest = { ...validRequest, companyName: 'Test & Co., LLC' };
      const result = await client.generateCertificate(specialRequest);

      expect(result.success).toBe(true);
    });
  });
});
