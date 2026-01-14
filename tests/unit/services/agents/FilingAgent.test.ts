/**
 * Unit tests for FilingAgent
 * Tests FR-023 (Filing submission) and related requirements
 */

import axios from 'axios';
import { FilingAgent } from '../../../../src/services/agents/FilingAgent';
import {
  AgentClientConfig,
  FilingRequest,
  FilingStatus,
  FilingType,
} from '../../../../src/services/agents/types';
import {
  mockFilingResponse,
  mockFilingFees,
  mockCompanyFormationData,
  createMockAxiosResponse,
  createMockAxiosError,
} from '../../../fixtures/mockData';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FilingAgent', () => {
  let agent: FilingAgent;
  let mockConfig: AgentClientConfig;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    mockConfig = {
      baseUrl: 'https://api.test.lovie.dev',
      apiKey: 'test-api-key',
      timeout: 30000,
    };

    agent = new FilingAgent(mockConfig);
  });

  afterEach(() => {
    agent.destroy();
  });

  describe('submitFiling', () => {
    const mockRequest: FilingRequest = {
      sessionId: 'session-123',
      companyData: mockCompanyFormationData,
      documentIds: ['doc-123', 'doc-456'],
      state: 'DE',
      filingType: FilingType.NEW_ENTITY,
    };

    it('should successfully submit filing', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockFilingResponse)
      );

      // Act
      const result = await agent.submitFiling(mockRequest);

      // Assert
      expect(result.filingId).toBeDefined();
      expect(result.status).toBe(FilingStatus.COMPLETED);
      expect(result.confirmationNumber).toBeDefined();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/filings/submit',
        mockRequest,
        expect.objectContaining({
          timeout: 60000, // Longer timeout for filing
          idempotencyKey: expect.stringContaining('filing-'),
        })
      );
    });

    it('should include filing fees', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockFilingResponse)
      );

      // Act
      const result = await agent.submitFiling(mockRequest);

      // Assert
      expect(result.fees).toBeDefined();
      expect(result.fees?.stateFee).toBe(90);
      expect(result.fees?.serviceFee).toBe(49);
      expect(result.fees?.total).toBe(139);
    });

    it('should handle expedited filing', async () => {
      // Arrange
      const expeditedResponse = {
        ...mockFilingResponse,
        fees: {
          ...mockFilingFees,
          expediteFee: 50,
          total: 189,
        },
      };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(expeditedResponse)
      );

      // Act
      const result = await agent.submitFiling({
        ...mockRequest,
        expedited: true,
      });

      // Assert
      expect(result.fees?.expediteFee).toBe(50);
      expect(result.fees?.total).toBe(189);
    });

    it('should use idempotency key for safe retries', async () => {
      // Arrange
      const customKey = 'custom-idempotency-123';
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockFilingResponse)
      );

      // Act
      await agent.submitFiling(mockRequest, { idempotencyKey: customKey });

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          idempotencyKey: customKey,
        })
      );
    });

    it('should retry on server error', async () => {
      // Arrange
      const error = createMockAxiosError(503, 'Service temporarily unavailable');
      mockAxiosInstance.post
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(createMockAxiosResponse(mockFilingResponse));

      // Act
      const result = await agent.submitFiling(mockRequest);

      // Assert
      expect(result.status).toBe(FilingStatus.COMPLETED);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateFees', () => {
    it('should calculate filing fees', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockFilingFees)
      );

      // Act
      const result = await agent.calculateFees('DE', 'LLC', false);

      // Assert
      expect(result.stateFee).toBe(90);
      expect(result.serviceFee).toBe(49);
      expect(result.total).toBe(139);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/filings/calculate-fees',
        {
          state: 'DE',
          companyType: 'LLC',
          expedited: false,
        },
        expect.objectContaining({
          skipRetry: true, // Fee calculation should be fast
        })
      );
    });

    it('should include expedite fees when requested', async () => {
      // Arrange
      const expeditedFees = {
        ...mockFilingFees,
        expediteFee: 50,
        total: 189,
      };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(expeditedFees)
      );

      // Act
      const result = await agent.calculateFees('DE', 'LLC', true);

      // Assert
      expect(result.expediteFee).toBe(50);
      expect(result.total).toBe(189);
    });
  });

  describe('getFilingStatus', () => {
    it('should get filing status', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockFilingResponse)
      );

      // Act
      const result = await agent.getFilingStatus('filing-123');

      // Assert
      expect(result.filingId).toBe('filing-123');
      expect(result.status).toBe(FilingStatus.COMPLETED);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/v1/filings/filing-123',
        expect.any(Object)
      );
    });
  });

  describe('getFilingProgress', () => {
    it('should get detailed filing progress', async () => {
      // Arrange
      const mockProgress = {
        status: FilingStatus.PROCESSING,
        progress: 75,
        currentStep: 'State review',
        message: 'Filing is being reviewed by state authorities',
        updates: [
          {
            timestamp: '2024-01-01T00:00:00.000Z',
            status: FilingStatus.SUBMITTED,
            message: 'Filing submitted',
          },
          {
            timestamp: '2024-01-01T01:00:00.000Z',
            status: FilingStatus.PROCESSING,
            message: 'Under review',
          },
        ],
      };
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockProgress)
      );

      // Act
      const result = await agent.getFilingProgress('filing-123');

      // Assert
      expect(result.progress).toBe(75);
      expect(result.updates).toHaveLength(2);
      expect(result.currentStep).toBe('State review');
    });
  });

  describe('validateFilingData', () => {
    const mockRequest: FilingRequest = {
      sessionId: 'session-123',
      companyData: mockCompanyFormationData,
      documentIds: ['doc-123'],
      state: 'DE',
      filingType: FilingType.NEW_ENTITY,
    };

    it('should validate filing data', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({ valid: true })
      );

      // Act
      const result = await agent.validateFilingData(mockRequest);

      // Assert
      expect(result.valid).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/filings/validate',
        mockRequest,
        expect.objectContaining({
          skipRetry: true,
        })
      );
    });

    it('should return validation errors and warnings', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({
          valid: false,
          errors: ['Required document missing'],
          warnings: ['Expedited processing may take 5-7 business days'],
        })
      );

      // Act
      const result = await agent.validateFilingData(mockRequest);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('isFilingComplete', () => {
    it('should return true for completed filing', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse({
          ...mockFilingResponse,
          status: FilingStatus.COMPLETED,
        })
      );

      // Act
      const result = await agent.isFilingComplete('filing-123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for approved filing', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse({
          ...mockFilingResponse,
          status: FilingStatus.APPROVED,
        })
      );

      // Act
      const result = await agent.isFilingComplete('filing-123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for pending filing', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse({
          ...mockFilingResponse,
          status: FilingStatus.PENDING,
        })
      );

      // Act
      const result = await agent.isFilingComplete('filing-123');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('waitForCompletion', () => {
    it('should poll until filing completes', async () => {
      // Arrange
      mockAxiosInstance.get
        .mockResolvedValueOnce(
          createMockAxiosResponse({
            ...mockFilingResponse,
            status: FilingStatus.PENDING,
          })
        )
        .mockResolvedValueOnce(
          createMockAxiosResponse({
            ...mockFilingResponse,
            status: FilingStatus.PROCESSING,
          })
        )
        .mockResolvedValueOnce(
          createMockAxiosResponse({
            ...mockFilingResponse,
            status: FilingStatus.COMPLETED,
          })
        );

      // Act
      const result = await agent.waitForCompletion('filing-123', {
        maxWaitTimeMs: 10000,
        pollIntervalMs: 100,
      });

      // Assert
      expect(result.status).toBe(FilingStatus.COMPLETED);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should call progress callback', async () => {
      // Arrange
      const progressCallback = jest.fn();
      mockAxiosInstance.get
        .mockResolvedValueOnce(
          createMockAxiosResponse({
            ...mockFilingResponse,
            status: FilingStatus.PROCESSING,
          })
        )
        .mockResolvedValueOnce(
          createMockAxiosResponse({
            status: FilingStatus.PROCESSING,
            progress: 50,
            currentStep: 'Review',
            message: 'Processing',
            updates: [],
          })
        )
        .mockResolvedValueOnce(
          createMockAxiosResponse({
            ...mockFilingResponse,
            status: FilingStatus.COMPLETED,
          })
        )
        .mockResolvedValueOnce(
          createMockAxiosResponse({
            status: FilingStatus.COMPLETED,
            progress: 100,
            currentStep: 'Complete',
            message: 'Done',
            updates: [],
          })
        );

      // Act
      await agent.waitForCompletion('filing-123', {
        maxWaitTimeMs: 10000,
        pollIntervalMs: 100,
        onProgress: progressCallback,
      });

      // Assert
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should timeout if filing takes too long', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValue(
        createMockAxiosResponse({
          ...mockFilingResponse,
          status: FilingStatus.PROCESSING,
        })
      );

      // Act & Assert
      await expect(
        agent.waitForCompletion('filing-123', {
          maxWaitTimeMs: 500,
          pollIntervalMs: 100,
        })
      ).rejects.toThrow('did not complete within timeout');
    });
  });

  describe('cancelFiling', () => {
    it('should cancel pending filing', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({})
      );

      // Act
      await agent.cancelFiling('filing-123', 'User requested cancellation');

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/filings/filing-123/cancel',
        { reason: 'User requested cancellation' },
        expect.any(Object)
      );
    });
  });

  describe('retryFiling', () => {
    it('should retry failed filing', async () => {
      // Arrange
      const retriedResponse = {
        ...mockFilingResponse,
        filingId: 'filing-retry-456',
        status: FilingStatus.SUBMITTED,
      };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(retriedResponse)
      );

      // Act
      const result = await agent.retryFiling('filing-123');

      // Assert
      expect(result.filingId).toBe('filing-retry-456');
      expect(result.status).toBe(FilingStatus.SUBMITTED);
    });
  });

  describe('getStateRequirements', () => {
    it('should get state-specific requirements', async () => {
      // Arrange
      const mockRequirements = {
        requiredDocuments: ['Articles of Organization', 'Operating Agreement'],
        requiredFields: ['companyName', 'registeredAgent', 'members'],
        specialRequirements: ['Must publish formation notice in local newspaper'],
        processingTime: '5-7 business days',
      };
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockRequirements)
      );

      // Act
      const result = await agent.getStateRequirements('NY', 'LLC');

      // Assert
      expect(result.requiredDocuments).toHaveLength(2);
      expect(result.specialRequirements).toContain('newspaper');
      expect(result.processingTime).toBe('5-7 business days');
    });
  });
});
