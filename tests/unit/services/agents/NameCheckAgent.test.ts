/**
 * Unit tests for NameCheckAgent
 * Tests FR-021 (Name check API integration) and FR-015 (5-second response time)
 */

import axios from 'axios';
import { NameCheckAgent } from '../../../../src/services/agents/NameCheckAgent';
import {
  AgentClientConfig,
  NameCheckRequest,
  AgentError,
} from '../../../../src/services/agents/types';
import {
  mockNameCheckAvailable,
  mockNameCheckUnavailable,
  createMockAxiosResponse,
  createMockAxiosError,
  mockTimeoutError,
} from '../../../fixtures/mockData';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NameCheckAgent', () => {
  let agent: NameCheckAgent;
  let mockConfig: AgentClientConfig;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock axios instance
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

    // Setup test config
    mockConfig = {
      baseUrl: 'https://api.test.lovie.dev',
      apiKey: 'test-api-key',
      timeout: 30000,
    };

    agent = new NameCheckAgent(mockConfig);
  });

  afterEach(() => {
    agent.destroy();
  });

  describe('checkNameAvailability', () => {
    const mockRequest: NameCheckRequest = {
      companyName: 'Test Company LLC',
      state: 'DE',
      companyType: 'LLC',
    };

    it('should successfully check available company name', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockNameCheckAvailable)
      );

      // Act
      const result = await agent.checkNameAvailability(mockRequest);

      // Assert
      expect(result.available).toBe(true);
      expect(result.companyName).toBe('Test Company LLC');
      expect(result.state).toBe('DE');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/name-check',
        expect.objectContaining({
          companyName: 'Test Company LLC',
          state: 'DE',
          companyType: 'LLC',
        }),
        expect.objectContaining({
          timeout: 5000, // FR-015: 5-second timeout
        })
      );
    });

    it('should return unavailable with suggestions', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockNameCheckUnavailable)
      );

      // Act
      const result = await agent.checkNameAvailability({
        ...mockRequest,
        companyName: 'Existing Company LLC',
      });

      // Assert
      expect(result.available).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.suggestions).toHaveLength(3);
      expect(result.similarNames).toBeDefined();
    });

    it('should include request ID for tracking', async () => {
      // Arrange
      const customRequestId = 'custom-request-123';
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockNameCheckAvailable)
      );

      // Act
      await agent.checkNameAvailability({
        ...mockRequest,
        requestId: customRequestId,
      });

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/name-check',
        expect.objectContaining({
          requestId: customRequestId,
        }),
        expect.any(Object)
      );
    });

    it('should auto-generate request ID if not provided', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockNameCheckAvailable)
      );

      // Act
      await agent.checkNameAvailability(mockRequest);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/name-check',
        expect.objectContaining({
          requestId: expect.stringContaining('name-check-'),
        }),
        expect.any(Object)
      );
    });

    it('should use custom timeout if provided', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockNameCheckAvailable)
      );

      // Act
      await agent.checkNameAvailability(mockRequest, { timeout: 10000 });

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 10000,
        })
      );
    });

    it('should retry on timeout error (FR-036)', async () => {
      // Arrange
      const timeoutError = createMockAxiosError(408, 'Request timeout', 'TIMEOUT');
      mockAxiosInstance.post
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(createMockAxiosResponse(mockNameCheckAvailable));

      // Act
      const result = await agent.checkNameAvailability(mockRequest);

      // Assert
      expect(result.available).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      // Arrange
      const error = createMockAxiosError(500, 'Server error');
      mockAxiosInstance.post.mockRejectedValue(error);

      // Act & Assert
      await expect(agent.checkNameAvailability(mockRequest)).rejects.toThrow(
        AgentError
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3); // Max attempts
    });

    it('should not retry on validation errors', async () => {
      // Arrange
      const validationError = createMockAxiosError(
        400,
        'Invalid company name',
        'VALIDATION_ERROR'
      );
      mockAxiosInstance.post.mockRejectedValueOnce(validationError);

      // Act & Assert
      await expect(agent.checkNameAvailability(mockRequest)).rejects.toThrow();
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('getCheckProgress', () => {
    it('should get progress for long-running checks', async () => {
      // Arrange
      const mockProgress = {
        status: 'checking',
        progress: 75,
        message: 'Checking state database...',
        estimatedTimeRemaining: 2,
      };
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockProgress)
      );

      // Act
      const result = await agent.getCheckProgress('name-check-123');

      // Assert
      expect(result.progress).toBe(75);
      expect(result.status).toBe('checking');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/v1/name-check/name-check-123/progress',
        expect.any(Object)
      );
    });
  });

  describe('checkMultipleNames', () => {
    it('should check multiple names in batch', async () => {
      // Arrange
      const requests: NameCheckRequest[] = [
        { companyName: 'Test Company 1 LLC', state: 'DE', companyType: 'LLC' },
        { companyName: 'Test Company 2 LLC', state: 'DE', companyType: 'LLC' },
      ];

      const mockResponses = [
        { ...mockNameCheckAvailable, companyName: 'Test Company 1 LLC' },
        { ...mockNameCheckAvailable, companyName: 'Test Company 2 LLC' },
      ];

      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockResponses)
      );

      // Act
      const results = await agent.checkMultipleNames(requests);

      // Assert
      expect(results).toHaveLength(2);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/name-check/batch',
        expect.objectContaining({
          requests: expect.arrayContaining([
            expect.objectContaining({ companyName: 'Test Company 1 LLC' }),
            expect.objectContaining({ companyName: 'Test Company 2 LLC' }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });

  describe('getNameSuggestions', () => {
    it('should get alternative name suggestions', async () => {
      // Arrange
      const mockSuggestions = {
        suggestions: [
          'Alternative Company LLC',
          'Alternative Group LLC',
          'New Alternative LLC',
        ],
      };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockSuggestions)
      );

      // Act
      const results = await agent.getNameSuggestions(
        'Unavailable Company LLC',
        'DE',
        'LLC'
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0]).toContain('Alternative');
    });
  });

  describe('validateNameFormat', () => {
    it('should validate name format locally', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({ valid: true })
      );

      // Act
      const result = await agent.validateNameFormat(
        'Valid Company LLC',
        'DE',
        'LLC'
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/name-check/validate-format',
        expect.any(Object),
        expect.objectContaining({
          skipRetry: true, // Format validation should not retry
        })
      );
    });

    it('should return validation errors', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({
          valid: false,
          errors: [
            'Name must include entity type (LLC, Inc, Corp)',
            'Name contains invalid characters',
          ],
        })
      );

      // Act
      const result = await agent.validateNameFormat(
        'Invalid Name!',
        'DE',
        'LLC'
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('cancelCheck', () => {
    it('should cancel pending name check', async () => {
      // Arrange
      mockAxiosInstance.delete.mockResolvedValueOnce(
        createMockAxiosResponse({})
      );

      // Act
      await agent.cancelCheck('name-check-123');

      // Assert
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/api/v1/name-check/name-check-123',
        expect.any(Object)
      );
    });
  });

  describe('getSimilarNames', () => {
    it('should get similar existing names', async () => {
      // Arrange
      const mockSimilar = {
        similarNames: mockNameCheckUnavailable.similarNames,
      };
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockSimilar)
      );

      // Act
      const results = await agent.getSimilarNames('Test Company LLC', 'DE');

      // Assert
      expect(results).toBeDefined();
      expect(results!.length).toBeGreaterThan(0);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('similar'),
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNABORTED';
      mockAxiosInstance.post.mockRejectedValue(networkError);

      // Act & Assert
      await expect(
        agent.checkNameAvailability({
          companyName: 'Test',
          state: 'DE',
          companyType: 'LLC',
        })
      ).rejects.toThrow(AgentError);
    });

    it('should handle rate limiting with retry-after', async () => {
      // Arrange
      const rateLimitError = createMockAxiosError(429, 'Too many requests');
      rateLimitError.response.data.retryAfter = 60;
      mockAxiosInstance.post.mockRejectedValueOnce(rateLimitError);

      // Act & Assert
      await expect(
        agent.checkNameAvailability({
          companyName: 'Test',
          state: 'DE',
          companyType: 'LLC',
        })
      ).rejects.toThrow();
    });
  });
});
