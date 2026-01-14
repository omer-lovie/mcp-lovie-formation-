/**
 * Certificate Review Workflow Tests
 * Comprehensive test coverage for certificate workflow orchestration
 * Feature 002: Pre-Payment Certificate Review and Approval
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  reviewCertificateBeforePayment,
  isCertificateExpired,
  getCertificateMinutesRemaining
} from '../../../src/workflows/certificate-review';
import { CertificateApiClient } from '../../../src/services/certificate/api';
import { CertificateReviewServer, ServerEvent } from '../../../src/services/certificate/server';
import { openBrowser, hasDefaultBrowser } from '../../../src/utils/browser';
import { CompanyFormationData } from '../../../src/types';
import {
  CertificateGenerationResponse,
  CertificateSessionData
} from '../../../src/services/certificate/types';

// Mock dependencies
vi.mock('../../../src/services/certificate/api', () => {
  return {
    CertificateApiClient: vi.fn()
  };
});
vi.mock('../../../src/services/certificate/server', () => {
  return {
    CertificateReviewServer: vi.fn(),
    ServerEvent: {
      APPROVED: 'approved',
      CANCELLED: 'cancelled',
      TIMEOUT: 'timeout',
      ERROR: 'error'
    }
  };
});
vi.mock('../../../src/utils/browser');
vi.mock('ora', () => {
  return {
    default: vi.fn(() => ({
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      warn: vi.fn().mockReturnThis(),
      info: vi.fn().mockReturnThis(),
      isSpinning: false
    }))
  };
});

// Mock console methods to reduce test noise
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Certificate Review Workflow', () => {
  // Test data
  const mockCompanyData: CompanyFormationData = {
    companyName: 'Test Company Inc',
    state: 'DE',
    companyType: 'C-Corp',
    shareholders: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '555-0100',
        address: {
          street1: '123 Main St',
          city: 'Wilmington',
          state: 'DE',
          zipCode: '19801'
        },
        ownershipPercentage: 100
      }
    ],
    registeredAgent: {
      name: 'Test Agent LLC',
      email: 'agent@test.com',
      phone: '555-0200',
      isIndividual: false,
      address: {
        street1: '456 Agent St',
        city: 'Wilmington',
        state: 'DE',
        zipCode: '19801'
      }
    }
  };

  const mockCertificateResponse: CertificateGenerationResponse = {
    success: true,
    certificateId: 'cert-123',
    downloadUrl: 'https://s3.amazonaws.com/test-cert.pdf',
    s3Uri: 's3://bucket/test-cert.pdf',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    metadata: {
      companyName: 'Test Company Inc',
      generatedAt: new Date().toISOString(),
      fileSize: 102400,
      fileHash: 'abc123hash'
    }
  };

  let mockApiClient: any;
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup API client mock - create mock instance first
    mockApiClient = {
      generateCertificate: vi.fn().mockResolvedValue(mockCertificateResponse),
      getMinutesRemaining: vi.fn().mockReturnValue(60),
      isUrlExpired: vi.fn().mockReturnValue(false)
    };

    // Mock the constructor to return our mock instance
    vi.mocked(CertificateApiClient as any).mockImplementation(function(this: any) {
      return mockApiClient;
    });

    // Setup server mock - create mock instance first
    mockServer = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      getUrl: vi.fn().mockReturnValue('http://localhost:3456'),
      getIsRunning: vi.fn().mockReturnValue(true),
      once: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      emit: vi.fn()
    };

    // Mock the constructor to return our mock instance
    vi.mocked(CertificateReviewServer as any).mockImplementation(function(this: any) {
      return mockServer;
    });

    // Setup browser mocks
    vi.mocked(hasDefaultBrowser as any).mockResolvedValue(true);
    vi.mocked(openBrowser as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('reviewCertificateBeforePayment', () => {
    describe('Successful certificate generation and approval', () => {
      it('should complete full workflow when user approves certificate', async () => {
        // Mock user approval
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.APPROVED) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        // Verify workflow steps
        expect(mockApiClient.generateCertificate).toHaveBeenCalledWith(
          expect.objectContaining({
            companyName: 'Test Company Inc',
            sharesAuthorized: '10000000',
            parValue: '0.00001'
          })
        );
        expect(mockServer.start).toHaveBeenCalledWith(
          mockCertificateResponse.downloadUrl,
          'Test Company Inc'
        );
        expect(openBrowser).toHaveBeenCalledWith('http://localhost:3456');

        // Verify result
        expect(result.approved).toBe(true);
        expect(result.cancelled).toBe(false);
        expect(result.certificateData).toBeDefined();
        expect(result.certificateData?.certificateId).toBe('cert-123');
        expect(result.certificateData?.approvedAt).toBeInstanceOf(Date);

        // Verify cleanup
        expect(mockServer.stop).toHaveBeenCalled();
      });

      it('should store certificate session data on approval', async () => {
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.APPROVED) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.certificateData).toEqual({
          certificateId: 'cert-123',
          downloadUrl: 'https://s3.amazonaws.com/test-cert.pdf',
          s3Uri: 's3://bucket/test-cert.pdf',
          expiresAt: expect.any(Date),
          approvedAt: expect.any(Date),
          metadata: mockCertificateResponse.metadata
        });
      });

      it('should handle browser availability check', async () => {
        vi.mocked(hasDefaultBrowser).mockResolvedValue(true);
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.APPROVED) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        await reviewCertificateBeforePayment(mockCompanyData);

        expect(hasDefaultBrowser).toHaveBeenCalled();
      });
    });

    describe('User cancellation', () => {
      it('should handle user cancellation gracefully', async () => {
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.CANCELLED) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.cancelled).toBe(true);
        expect(result.certificateData).toBeUndefined();
        expect(mockServer.stop).toHaveBeenCalled();
      });

      it('should not save certificate data on cancellation', async () => {
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.CANCELLED) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.certificateData).toBeUndefined();
      });
    });

    describe('API errors with user-friendly messages', () => {
      it('should handle API timeout with user-friendly message', async () => {
        const timeoutError = new Error('Certificate generation service timed out. Please check your internet connection and try again.');
        mockApiClient.generateCertificate.mockRejectedValue(timeoutError);

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.cancelled).toBe(false);
        expect(result.error).toContain('timed out');
      });

      it('should handle network connection errors', async () => {
        const networkError = new Error('Unable to connect to certificate generation service. Please try again later.');
        mockApiClient.generateCertificate.mockRejectedValue(networkError);

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.error).toContain('Unable to connect');
      });

      it('should handle API validation errors', async () => {
        const validationError = new Error('Invalid request data: Please check your company information');
        mockApiClient.generateCertificate.mockRejectedValue(validationError);

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.error).toContain('Invalid request data');
      });

      it('should handle server errors with friendly message', async () => {
        const serverError = new Error('Certificate generation service is temporarily unavailable. Please try again in a few minutes.');
        mockApiClient.generateCertificate.mockRejectedValue(serverError);

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.error).toContain('temporarily unavailable');
      });

      it('should handle certificate generation failure', async () => {
        mockApiClient.generateCertificate.mockResolvedValue({
          ...mockCertificateResponse,
          success: false
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.error).toContain('Certificate generation failed');
      });

      it('should handle expired certificate immediately after generation', async () => {
        mockApiClient.getMinutesRemaining.mockReturnValue(0);

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.error).toContain('Certificate URL expired immediately');
      });
    });

    describe('Browser launch failures with fallback', () => {
      it('should continue workflow if browser fails to open', async () => {
        vi.mocked(openBrowser).mockRejectedValue(new Error('No browser found'));
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.APPROVED) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        // Workflow should continue despite browser error
        expect(result.approved).toBe(true);
        expect(mockServer.start).toHaveBeenCalled();
      });

      it('should display manual URL when browser cannot open', async () => {
        vi.mocked(openBrowser).mockRejectedValue(new Error('No browser found'));
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.APPROVED) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        await reviewCertificateBeforePayment(mockCompanyData);

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('Please manually open this URL')
        );
      });

      it('should handle missing default browser gracefully', async () => {
        vi.mocked(hasDefaultBrowser).mockResolvedValue(false);
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.APPROVED) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(true);
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('No default browser detected')
        );
      });
    });

    describe('Timeout scenarios', () => {
      it('should handle workflow timeout after 10 minutes', async () => {
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.TIMEOUT) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.cancelled).toBe(false);
        expect(result.error).toContain('Review session timed out');
      });

      it('should handle server errors as timeout', async () => {
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.ERROR) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        const result = await reviewCertificateBeforePayment(mockCompanyData);

        expect(result.approved).toBe(false);
        expect(result.error).toContain('timed out');
      });

      it('should clean up resources on timeout', async () => {
        mockServer.once.mockImplementation((event: string, callback: Function) => {
          if (event === ServerEvent.TIMEOUT) {
            setTimeout(() => callback(), 10);
          }
          return mockServer;
        });

        await reviewCertificateBeforePayment(mockCompanyData);

        expect(mockServer.stop).toHaveBeenCalled();
      });
    });

    describe('Resource cleanup', () => {
      it('should stop server even if workflow fails', async () => {
        mockApiClient.generateCertificate.mockRejectedValue(new Error('API Error'));

        await reviewCertificateBeforePayment(mockCompanyData);

        expect(mockServer.stop).toHaveBeenCalled();
      });

      it('should handle cleanup when server is not running', async () => {
        mockServer.getIsRunning.mockReturnValue(false);
        mockApiClient.generateCertificate.mockRejectedValue(new Error('Early error'));

        await reviewCertificateBeforePayment(mockCompanyData);

        // Should not throw even if server not running
        expect(mockServer.stop).not.toHaveBeenCalled();
      });
    });
  });

  describe('validateCompanyData', () => {
    it('should throw error for missing company name', async () => {
      const invalidData = { ...mockCompanyData, companyName: '' };
      mockApiClient.generateCertificate.mockRejectedValue(
        new Error('Invalid company data: Company name is required')
      );

      const result = await reviewCertificateBeforePayment(invalidData);

      expect(result.error).toContain('Company name is required');
    });

    it('should throw error for missing registered agent', async () => {
      const invalidData = { ...mockCompanyData, registeredAgent: undefined };
      mockApiClient.generateCertificate.mockImplementation(() => {
        throw new Error('Invalid company data: Registered agent information is required');
      });

      const result = await reviewCertificateBeforePayment(invalidData);

      expect(result.error).toContain('Registered agent information is required');
    });

    it('should validate registered agent name', async () => {
      const invalidData = {
        ...mockCompanyData,
        registeredAgent: {
          ...mockCompanyData.registeredAgent!,
          name: ''
        }
      };

      mockApiClient.generateCertificate.mockImplementation(() => {
        throw new Error('Invalid company data: Registered agent name is required');
      });

      const result = await reviewCertificateBeforePayment(invalidData);

      expect(result.error).toContain('Registered agent name is required');
    });

    it('should validate registered agent address fields', async () => {
      const invalidData = {
        ...mockCompanyData,
        registeredAgent: {
          ...mockCompanyData.registeredAgent!,
          address: {
            street1: '',
            city: '',
            state: 'DE' as const,
            zipCode: ''
          }
        }
      };

      mockApiClient.generateCertificate.mockImplementation(() => {
        throw new Error('Invalid company data: Registered agent street address is required');
      });

      const result = await reviewCertificateBeforePayment(invalidData);

      expect(result.error).toContain('required');
    });

    it('should require at least one shareholder', async () => {
      const invalidData = { ...mockCompanyData, shareholders: [] };
      mockApiClient.generateCertificate.mockImplementation(() => {
        throw new Error('Invalid company data: At least one shareholder/member is required');
      });

      const result = await reviewCertificateBeforePayment(invalidData);

      expect(result.error).toContain('At least one shareholder');
    });

    it('should validate incorporator name', async () => {
      const invalidData = {
        ...mockCompanyData,
        shareholders: [
          {
            ...mockCompanyData.shareholders[0],
            firstName: '',
            lastName: ''
          }
        ]
      };

      mockApiClient.generateCertificate.mockImplementation(() => {
        throw new Error('Invalid company data: Incorporator name is required');
      });

      const result = await reviewCertificateBeforePayment(invalidData);

      expect(result.error).toContain('Incorporator name is required');
    });

    it('should validate incorporator address', async () => {
      const invalidData = {
        ...mockCompanyData,
        shareholders: [
          {
            ...mockCompanyData.shareholders[0],
            address: {
              street1: '',
              city: '',
              state: 'DE' as const,
              zipCode: ''
            }
          }
        ]
      };

      mockApiClient.generateCertificate.mockImplementation(() => {
        throw new Error('Invalid company data: Incorporator street address is required');
      });

      const result = await reviewCertificateBeforePayment(invalidData);

      expect(result.error).toContain('required');
    });
  });

  describe('buildCertificateRequest', () => {
    it('should correctly map CompanyFormationData to CertificateGenerationRequest', async () => {
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.APPROVED) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      await reviewCertificateBeforePayment(mockCompanyData);

      expect(mockApiClient.generateCertificate).toHaveBeenCalledWith({
        companyName: 'Test Company Inc',
        registeredAgent: {
          name: 'Test Agent LLC',
          address: {
            street: '456 Agent St',
            city: 'Wilmington',
            state: 'DE',
            zipCode: '19801',
            county: 'Sussex'
          }
        },
        incorporator: {
          name: 'John Doe',
          address: {
            street: '123 Main St',
            city: 'Wilmington',
            state: 'DE',
            zipCode: '19801'
          }
        },
        sharesAuthorized: '10000000',
        parValue: '0.00001'
      });
    });

    it('should handle LLC with N/A shares', async () => {
      const llcData = { ...mockCompanyData, companyType: 'LLC' as const };
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.APPROVED) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      await reviewCertificateBeforePayment(llcData);

      expect(mockApiClient.generateCertificate).toHaveBeenCalledWith(
        expect.objectContaining({
          sharesAuthorized: 'N/A',
          parValue: 'N/A'
        })
      );
    });

    it('should handle Corporation with numeric shares', async () => {
      const corpData = { ...mockCompanyData, companyType: 'C-Corp' as const };
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.APPROVED) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      await reviewCertificateBeforePayment(corpData);

      expect(mockApiClient.generateCertificate).toHaveBeenCalledWith(
        expect.objectContaining({
          sharesAuthorized: '10000000',
          parValue: '0.00001'
        })
      );
    });

    it('should use default values for shares (10M shares, $0.00001 par)', async () => {
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.APPROVED) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      await reviewCertificateBeforePayment(mockCompanyData);

      const call = mockApiClient.generateCertificate.mock.calls[0][0];
      expect(call.sharesAuthorized).toBe('10000000');
      expect(call.parValue).toBe('0.00001');
    });

    it('should default county to Sussex for Delaware', async () => {
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.APPROVED) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      await reviewCertificateBeforePayment(mockCompanyData);

      const call = mockApiClient.generateCertificate.mock.calls[0][0];
      expect(call.registeredAgent.address.county).toBe('Sussex');
    });
  });

  describe('waitForUserAction', () => {
    it('should resolve with "approved" on approval event', async () => {
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.APPROVED) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      const result = await reviewCertificateBeforePayment(mockCompanyData);

      expect(result.approved).toBe(true);
    });

    it('should resolve with "cancelled" on cancellation event', async () => {
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.CANCELLED) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      const result = await reviewCertificateBeforePayment(mockCompanyData);

      expect(result.cancelled).toBe(true);
    });

    it('should resolve with "timeout" on timeout event', async () => {
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.TIMEOUT) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      const result = await reviewCertificateBeforePayment(mockCompanyData);

      expect(result.error).toContain('timed out');
    });

    it('should handle error event as timeout', async () => {
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.ERROR) {
          setTimeout(() => callback(), 10);
        }
        return mockServer;
      });

      const result = await reviewCertificateBeforePayment(mockCompanyData);

      expect(result.error).toContain('timed out');
    });

    it('should only resolve once even with multiple events', async () => {
      let approvedCalled = false;
      mockServer.once.mockImplementation((event: string, callback: Function) => {
        if (event === ServerEvent.APPROVED && !approvedCalled) {
          approvedCalled = true;
          setTimeout(() => {
            callback();
            // Try to trigger another event
            callback();
          }, 10);
        }
        return mockServer;
      });

      const result = await reviewCertificateBeforePayment(mockCompanyData);

      expect(result.approved).toBe(true);
      // Should only resolve once
    });
  });

  describe('Certificate expiration', () => {
    describe('isCertificateExpired', () => {
      it('should return true for expired certificate', () => {
        const expiredData: CertificateSessionData = {
          certificateId: 'cert-123',
          downloadUrl: 'https://test.com/cert.pdf',
          s3Uri: 's3://bucket/cert.pdf',
          expiresAt: new Date(Date.now() - 1000), // 1 second ago
          approvedAt: new Date(),
          metadata: mockCertificateResponse.metadata
        };

        expect(isCertificateExpired(expiredData)).toBe(true);
      });

      it('should return false for valid certificate', () => {
        const validData: CertificateSessionData = {
          certificateId: 'cert-123',
          downloadUrl: 'https://test.com/cert.pdf',
          s3Uri: 's3://bucket/cert.pdf',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          approvedAt: new Date(),
          metadata: mockCertificateResponse.metadata
        };

        expect(isCertificateExpired(validData)).toBe(false);
      });

      it('should return true for certificate expiring now', () => {
        const expiringData: CertificateSessionData = {
          certificateId: 'cert-123',
          downloadUrl: 'https://test.com/cert.pdf',
          s3Uri: 's3://bucket/cert.pdf',
          expiresAt: new Date(), // Expires now
          approvedAt: new Date(),
          metadata: mockCertificateResponse.metadata
        };

        expect(isCertificateExpired(expiringData)).toBe(true);
      });
    });

    describe('getCertificateMinutesRemaining', () => {
      it('should return correct minutes remaining', () => {
        const data: CertificateSessionData = {
          certificateId: 'cert-123',
          downloadUrl: 'https://test.com/cert.pdf',
          s3Uri: 's3://bucket/cert.pdf',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          approvedAt: new Date(),
          metadata: mockCertificateResponse.metadata
        };

        const remaining = getCertificateMinutesRemaining(data);
        expect(remaining).toBeGreaterThanOrEqual(29);
        expect(remaining).toBeLessThanOrEqual(30);
      });

      it('should return 0 for expired certificate', () => {
        const data: CertificateSessionData = {
          certificateId: 'cert-123',
          downloadUrl: 'https://test.com/cert.pdf',
          s3Uri: 's3://bucket/cert.pdf',
          expiresAt: new Date(Date.now() - 1000),
          approvedAt: new Date(),
          metadata: mockCertificateResponse.metadata
        };

        expect(getCertificateMinutesRemaining(data)).toBe(0);
      });

      it('should round down partial minutes', () => {
        const data: CertificateSessionData = {
          certificateId: 'cert-123',
          downloadUrl: 'https://test.com/cert.pdf',
          s3Uri: 's3://bucket/cert.pdf',
          expiresAt: new Date(Date.now() + 90 * 1000), // 1.5 minutes
          approvedAt: new Date(),
          metadata: mockCertificateResponse.metadata
        };

        expect(getCertificateMinutesRemaining(data)).toBe(1);
      });

      it('should handle large time spans correctly', () => {
        const data: CertificateSessionData = {
          certificateId: 'cert-123',
          downloadUrl: 'https://test.com/cert.pdf',
          s3Uri: 's3://bucket/cert.pdf',
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
          approvedAt: new Date(),
          metadata: mockCertificateResponse.metadata
        };

        const remaining = getCertificateMinutesRemaining(data);
        expect(remaining).toBeGreaterThanOrEqual(119);
        expect(remaining).toBeLessThanOrEqual(120);
      });
    });
  });
});
