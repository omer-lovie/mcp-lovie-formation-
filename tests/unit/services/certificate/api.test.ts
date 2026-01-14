/**
 * Unit Tests - Certificate API Client
 * Tests certificate generation API communication
 * Feature 002: FR-001, FR-002, FR-003
 */

import axios, { AxiosError } from 'axios';
import { CertificateApiClient } from '../../../../src/services/certificate/api';
import {
  CertificateGenerationRequest,
  CertificateGenerationResponse
} from '../../../../src/services/certificate/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CertificateApiClient', () => {
  let client: CertificateApiClient;
  let mockAxiosInstance: any;

  // Valid request fixture
  const validRequest: CertificateGenerationRequest = {
    companyName: 'Test Corporation',
    registeredAgent: {
      name: 'John Doe',
      address: {
        street: '123 Main St',
        city: 'Wilmington',
        state: 'DE',
        zipCode: '19801',
        county: 'New Castle'
      }
    },
    incorporator: {
      name: 'Jane Smith',
      address: {
        street: '456 Oak Ave',
        city: 'Dover',
        state: 'DE',
        zipCode: '19901'
      }
    },
    sharesAuthorized: 1500,
    parValue: 0.001
  };

  // Valid response fixture
  const validResponse: CertificateGenerationResponse = {
    success: true,
    certificateId: 'cert_12345',
    downloadUrl: 'https://s3.amazonaws.com/bucket/cert.pdf?signature=xyz',
    s3Uri: 's3://bucket/cert.pdf',
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    metadata: {
      companyName: 'Test Corporation',
      generatedAt: new Date().toISOString(),
      fileSize: 245678,
      fileHash: 'abc123def456'
    }
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      post: jest.fn(),
      defaults: {
        baseURL: 'https://helpful-beauty-production.up.railway.app/api/v1',
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    };

    // Mock axios.create to return our mock instance
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create client
    client = new CertificateApiClient();
  });

  describe('constructor', () => {
    it('should create client with default configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://helpful-beauty-production.up.railway.app/api/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('should create client with custom configuration', () => {
      jest.clearAllMocks();

      new CertificateApiClient({
        baseUrl: 'https://custom-api.example.com',
        timeout: 60000
      });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://custom-api.example.com',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('generateCertificate - Success Cases', () => {
    it('should generate certificate with valid request and numbers for sharesAuthorized and parValue', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(validRequest);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/certificates', validRequest);
      expect(result).toEqual(validResponse);
      expect(result.certificateId).toBe('cert_12345');
      expect(result.downloadUrl).toBeTruthy();
      expect(result.metadata.companyName).toBe('Test Corporation');
    });

    it('should handle valid request with large share numbers', async () => {
      const largeShareRequest = {
        ...validRequest,
        sharesAuthorized: 1000000000,
        parValue: 100.50
      };

      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(largeShareRequest);

      expect(result).toEqual(validResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/certificates', largeShareRequest);
    });

    it('should handle valid request with zero par value', async () => {
      const zeroParRequest = {
        ...validRequest,
        parValue: 0
      };

      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(zeroParRequest);

      expect(result).toEqual(validResponse);
    });
  });

  describe('Request Validation', () => {
    it('should throw error when companyName is missing', async () => {
      const invalidRequest = {
        ...validRequest,
        companyName: ''
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Invalid certificate request: Company name is required');
    });

    it('should throw error when companyName is only whitespace', async () => {
      const invalidRequest = {
        ...validRequest,
        companyName: '   '
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Invalid certificate request: Company name is required');
    });

    it('should throw error when registered agent name is missing', async () => {
      const invalidRequest = {
        ...validRequest,
        registeredAgent: {
          ...validRequest.registeredAgent,
          name: ''
        }
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Registered agent name is required');
    });

    it('should throw error when registered agent address is incomplete', async () => {
      const invalidRequest = {
        ...validRequest,
        registeredAgent: {
          name: 'John Doe',
          address: {
            street: '',
            city: 'Wilmington',
            state: 'DE',
            zipCode: '19801',
            county: 'New Castle'
          }
        }
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Registered agent street is required');
    });

    it('should throw error when registered agent county is missing', async () => {
      const invalidRequest = {
        ...validRequest,
        registeredAgent: {
          ...validRequest.registeredAgent,
          address: {
            ...validRequest.registeredAgent.address,
            county: ''
          }
        }
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Registered agent county is required');
    });

    it('should throw error when incorporator name is missing', async () => {
      const invalidRequest = {
        ...validRequest,
        incorporator: {
          ...validRequest.incorporator,
          name: ''
        }
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Incorporator name is required');
    });

    it('should throw error when incorporator address is incomplete', async () => {
      const invalidRequest = {
        ...validRequest,
        incorporator: {
          name: 'Jane Smith',
          address: {
            street: '456 Oak Ave',
            city: '',
            state: 'DE',
            zipCode: '19901'
          }
        }
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Incorporator city is required');
    });

    it('should throw error when sharesAuthorized is not a number', async () => {
      const invalidRequest = {
        ...validRequest,
        sharesAuthorized: 'not a number' as any
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Shares authorized must be a number');
    });

    it('should throw error when sharesAuthorized is negative', async () => {
      const invalidRequest = {
        ...validRequest,
        sharesAuthorized: -100
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Shares authorized must be non-negative');
    });

    it('should throw error when parValue is not a number', async () => {
      const invalidRequest = {
        ...validRequest,
        parValue: 'not a number' as any
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Par value must be a number');
    });

    it('should throw error when parValue is negative', async () => {
      const invalidRequest = {
        ...validRequest,
        parValue: -10
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Par value must be non-negative');
    });

    it('should collect multiple validation errors', async () => {
      const invalidRequest = {
        ...validRequest,
        companyName: '',
        registeredAgent: {
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            county: ''
          }
        }
      };

      await expect(client.generateCertificate(invalidRequest))
        .rejects
        .toThrow('Invalid certificate request:');

      try {
        await client.generateCertificate(invalidRequest);
      } catch (error: any) {
        expect(error.message).toContain('Company name is required');
        expect(error.message).toContain('Registered agent name is required');
        expect(error.message).toContain('Registered agent street is required');
      }
    });
  });

  describe('Response Validation', () => {
    it('should throw error when response.success is false', async () => {
      const invalidResponse = {
        ...validResponse,
        success: false
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Invalid API response: API returned success=false');
    });

    it('should throw error when certificateId is missing', async () => {
      const invalidResponse = {
        ...validResponse,
        certificateId: ''
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Missing certificateId');
    });

    it('should throw error when downloadUrl is missing', async () => {
      const invalidResponse = {
        ...validResponse,
        downloadUrl: ''
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Missing downloadUrl');
    });

    it('should throw error when s3Uri is missing', async () => {
      const invalidResponse = {
        ...validResponse,
        s3Uri: ''
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Missing s3Uri');
    });

    it('should throw error when expiresAt is missing', async () => {
      const invalidResponse = {
        ...validResponse,
        expiresAt: ''
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Missing expiresAt');
    });

    it('should throw error when metadata is missing', async () => {
      const invalidResponse = {
        ...validResponse,
        metadata: undefined as any
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Missing metadata');
    });

    it('should throw error when metadata.companyName is missing', async () => {
      const invalidResponse = {
        ...validResponse,
        metadata: {
          ...validResponse.metadata,
          companyName: ''
        }
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Missing metadata.companyName');
    });

    it('should throw error when metadata.fileSize is not a number', async () => {
      const invalidResponse = {
        ...validResponse,
        metadata: {
          ...validResponse.metadata,
          fileSize: undefined as any
        }
      };

      mockAxiosInstance.post.mockResolvedValue({ data: invalidResponse });

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Missing metadata.fileSize');
    });
  });

  describe('Error Handling - Network Errors', () => {
    it('should handle network timeout (ECONNABORTED)', async () => {
      const timeoutError = new Error('timeout') as AxiosError;
      timeoutError.code = 'ECONNABORTED';
      timeoutError.isAxiosError = true;

      mockAxiosInstance.post.mockRejectedValue(timeoutError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Certificate generation service timed out. Please check your internet connection and try again.');
    });

    it('should handle network timeout (ETIMEDOUT)', async () => {
      const timeoutError = new Error('timeout') as AxiosError;
      timeoutError.code = 'ETIMEDOUT';
      timeoutError.isAxiosError = true;

      mockAxiosInstance.post.mockRejectedValue(timeoutError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Certificate generation service timed out. Please check your internet connection and try again.');
    });

    it('should handle connection refused (ECONNREFUSED)', async () => {
      const connError = new Error('connection refused') as AxiosError;
      connError.code = 'ECONNREFUSED';
      connError.isAxiosError = true;

      mockAxiosInstance.post.mockRejectedValue(connError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Unable to connect to certificate generation service. Please try again later.');
    });

    it('should handle DNS errors (ENOTFOUND)', async () => {
      const dnsError = new Error('not found') as AxiosError;
      dnsError.code = 'ENOTFOUND';
      dnsError.isAxiosError = true;

      mockAxiosInstance.post.mockRejectedValue(dnsError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Unable to connect to certificate generation service. Please try again later.');
    });
  });

  describe('Error Handling - HTTP Errors', () => {
    it('should handle HTTP 400 (Bad Request)', async () => {
      const badRequestError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Invalid company name format' }
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(badRequestError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Invalid request data: Invalid company name format');
    });

    it('should handle HTTP 400 without message', async () => {
      const badRequestError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {}
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(badRequestError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Invalid request data: Please check your company information');
    });

    it('should handle HTTP 404 (Not Found)', async () => {
      const notFoundError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {}
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(notFoundError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Certificate generation endpoint not found. Please contact support.');
    });

    it('should handle HTTP 429 (Rate Limit)', async () => {
      const rateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {}
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(rateLimitError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Too many requests. Please wait a moment and try again.');
    });

    it('should handle HTTP 500 (Internal Server Error)', async () => {
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {}
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(serverError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Certificate generation service is temporarily unavailable. Please try again in a few minutes.');
    });

    it('should handle HTTP 502 (Bad Gateway)', async () => {
      const gatewayError = {
        isAxiosError: true,
        response: {
          status: 502,
          data: {}
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(gatewayError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Certificate generation service is temporarily unavailable. Please try again in a few minutes.');
    });

    it('should handle HTTP 503 (Service Unavailable)', async () => {
      const unavailableError = {
        isAxiosError: true,
        response: {
          status: 503,
          data: {}
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(unavailableError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Certificate generation service is temporarily unavailable. Please try again in a few minutes.');
    });

    it('should handle HTTP 401 (Unauthorized)', async () => {
      const authError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {}
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(authError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Authentication failed. Please contact support.');
    });

    it('should handle HTTP 403 (Forbidden)', async () => {
      const forbiddenError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {}
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(forbiddenError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Authentication failed. Please contact support.');
    });

    it('should handle unknown HTTP errors', async () => {
      const unknownError = {
        isAxiosError: true,
        response: {
          status: 418,
          data: { message: 'I am a teapot' }
        }
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(unknownError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Certificate generation failed: I am a teapot');
    });

    it('should handle axios error without response', async () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network error occurred'
      } as AxiosError;

      mockAxiosInstance.post.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Certificate generation request failed: Network error occurred');
    });
  });

  describe('Error Handling - Non-Axios Errors', () => {
    it('should handle standard Error objects', async () => {
      const standardError = new Error('Something went wrong');

      mockAxiosInstance.post.mockRejectedValue(standardError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('Something went wrong');
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'string error';

      mockAxiosInstance.post.mockRejectedValue(unknownError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);

      await expect(client.generateCertificate(validRequest))
        .rejects
        .toThrow('An unexpected error occurred during certificate generation');
    });
  });

  describe('URL Expiration - isUrlExpired', () => {
    it('should return false for future expiration date (string)', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      expect(client.isUrlExpired(futureDate)).toBe(false);
    });

    it('should return false for future expiration date (Date object)', () => {
      const futureDate = new Date(Date.now() + 3600000);
      expect(client.isUrlExpired(futureDate)).toBe(false);
    });

    it('should return true for past expiration date (string)', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      expect(client.isUrlExpired(pastDate)).toBe(true);
    });

    it('should return true for past expiration date (Date object)', () => {
      const pastDate = new Date(Date.now() - 3600000);
      expect(client.isUrlExpired(pastDate)).toBe(true);
    });

    it('should return true for current moment (expired)', () => {
      const now = new Date();
      expect(client.isUrlExpired(now)).toBe(true);
    });

    it('should handle dates 1 second in the future', () => {
      const almostExpired = new Date(Date.now() + 1000);
      expect(client.isUrlExpired(almostExpired)).toBe(false);
    });

    it('should handle dates 1 second in the past', () => {
      const justExpired = new Date(Date.now() - 1000);
      expect(client.isUrlExpired(justExpired)).toBe(true);
    });
  });

  describe('URL Expiration - getMinutesRemaining', () => {
    it('should return correct minutes for 1 hour future date', () => {
      const oneHourFuture = new Date(Date.now() + 3600000);
      const minutes = client.getMinutesRemaining(oneHourFuture);
      expect(minutes).toBe(60);
    });

    it('should return correct minutes for 30 minutes future date', () => {
      const halfHourFuture = new Date(Date.now() + 1800000);
      const minutes = client.getMinutesRemaining(halfHourFuture);
      expect(minutes).toBe(30);
    });

    it('should return 0 for past dates', () => {
      const pastDate = new Date(Date.now() - 3600000);
      expect(client.getMinutesRemaining(pastDate)).toBe(0);
    });

    it('should return 0 for current moment', () => {
      const now = new Date();
      expect(client.getMinutesRemaining(now)).toBe(0);
    });

    it('should handle string date format', () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const minutes = client.getMinutesRemaining(futureDate);
      expect(minutes).toBe(60);
    });

    it('should floor partial minutes correctly', () => {
      const futureDate = new Date(Date.now() + 90000); // 1.5 minutes
      const minutes = client.getMinutesRemaining(futureDate);
      expect(minutes).toBe(1); // Should floor to 1
    });

    it('should handle very large future dates', () => {
      const distantFuture = new Date(Date.now() + 86400000); // 24 hours
      const minutes = client.getMinutesRemaining(distantFuture);
      expect(minutes).toBe(1440); // 24 * 60
    });

    it('should return 0 for dates 1 second in the past', () => {
      const justExpired = new Date(Date.now() - 1000);
      expect(client.getMinutesRemaining(justExpired)).toBe(0);
    });

    it('should return 0 for dates 59 seconds in the future', () => {
      const almostAMinute = new Date(Date.now() + 59000);
      expect(client.getMinutesRemaining(almostAMinute)).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely large share numbers', async () => {
      const extremeRequest = {
        ...validRequest,
        sharesAuthorized: 999999999999999,
        parValue: 999999.99
      };

      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(extremeRequest);
      expect(result).toEqual(validResponse);
    });

    it('should handle zero shares authorized', async () => {
      const zeroSharesRequest = {
        ...validRequest,
        sharesAuthorized: 0
      };

      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(zeroSharesRequest);
      expect(result).toEqual(validResponse);
    });

    it('should handle very small decimal par values', async () => {
      const smallParRequest = {
        ...validRequest,
        parValue: 0.000001
      };

      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(smallParRequest);
      expect(result).toEqual(validResponse);
    });

    it('should handle company names with special characters', async () => {
      const specialCharsRequest = {
        ...validRequest,
        companyName: 'Test & Associates, LLC (Delaware)'
      };

      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(specialCharsRequest);
      expect(result).toEqual(validResponse);
    });

    it('should handle very long company names', async () => {
      const longNameRequest = {
        ...validRequest,
        companyName: 'A'.repeat(500)
      };

      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(longNameRequest);
      expect(result).toEqual(validResponse);
    });

    it('should handle addresses with apartment numbers', async () => {
      const aptRequest = {
        ...validRequest,
        registeredAgent: {
          ...validRequest.registeredAgent,
          address: {
            ...validRequest.registeredAgent.address,
            street: '123 Main St Apt 4B'
          }
        }
      };

      mockAxiosInstance.post.mockResolvedValue({ data: validResponse });

      const result = await client.generateCertificate(aptRequest);
      expect(result).toEqual(validResponse);
    });

    it('should handle response with very large file size', async () => {
      const largeFileResponse = {
        ...validResponse,
        metadata: {
          ...validResponse.metadata,
          fileSize: 999999999
        }
      };

      mockAxiosInstance.post.mockResolvedValue({ data: largeFileResponse });

      const result = await client.generateCertificate(validRequest);
      expect(result.metadata.fileSize).toBe(999999999);
    });

    it('should handle response with zero file size', async () => {
      const zeroFileResponse = {
        ...validResponse,
        metadata: {
          ...validResponse.metadata,
          fileSize: 0
        }
      };

      mockAxiosInstance.post.mockResolvedValue({ data: zeroFileResponse });

      const result = await client.generateCertificate(validRequest);
      expect(result.metadata.fileSize).toBe(0);
    });
  });
});
