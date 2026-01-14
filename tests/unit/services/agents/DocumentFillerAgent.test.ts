/**
 * Unit tests for DocumentFillerAgent
 * Tests FR-022 (Document generation) and SC-006 (30-second completion time)
 */

import axios from 'axios';
import { DocumentFillerAgent } from '../../../../src/services/agents/DocumentFillerAgent';
import {
  AgentClientConfig,
  DocumentGenerationRequest,
  DocumentType,
  DocumentStatus,
} from '../../../../src/services/agents/types';
import {
  mockDocumentGenerationResponse,
  mockCompanyFormationData,
  mockCompanyFormationDataCCorp,
  createMockAxiosResponse,
  createMockAxiosError,
} from '../../../fixtures/mockData';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DocumentFillerAgent', () => {
  let agent: DocumentFillerAgent;
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

    agent = new DocumentFillerAgent(mockConfig);
  });

  afterEach(() => {
    agent.destroy();
  });

  describe('generateDocument', () => {
    const mockRequest: DocumentGenerationRequest = {
      sessionId: 'session-123',
      companyData: mockCompanyFormationData,
      documentType: DocumentType.ARTICLES_OF_ORGANIZATION,
    };

    it('should successfully generate document', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockDocumentGenerationResponse)
      );

      // Act
      const result = await agent.generateDocument(mockRequest);

      // Assert
      expect(result.documentId).toBeDefined();
      expect(result.status).toBe(DocumentStatus.COMPLETED);
      expect(result.downloadUrl).toBeDefined();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/documents/generate',
        mockRequest,
        expect.objectContaining({
          timeout: 45000, // SC-006: 30s + buffer
        })
      );
    });

    it('should include document metadata', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockDocumentGenerationResponse)
      );

      // Act
      const result = await agent.generateDocument(mockRequest);

      // Assert
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.pageCount).toBe(5);
      expect(result.metadata?.fileSize).toBe(102400);
      expect(result.metadata?.format).toBe('PDF');
      expect(result.metadata?.checksum).toBeDefined();
    });

    it('should handle custom timeout', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockDocumentGenerationResponse)
      );

      // Act
      await agent.generateDocument(mockRequest, { timeout: 60000 });

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });

    it('should retry on server error', async () => {
      // Arrange
      const error = createMockAxiosError(503, 'Service unavailable');
      mockAxiosInstance.post
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(createMockAxiosResponse(mockDocumentGenerationResponse));

      // Act
      const result = await agent.generateDocument(mockRequest);

      // Assert
      expect(result.status).toBe(DocumentStatus.COMPLETED);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateAllDocuments', () => {
    it('should generate all required LLC documents', async () => {
      // Arrange
      const mockResponses = [
        {
          ...mockDocumentGenerationResponse,
          documentType: DocumentType.ARTICLES_OF_ORGANIZATION,
        },
        {
          ...mockDocumentGenerationResponse,
          documentId: 'doc-456',
          documentType: DocumentType.OPERATING_AGREEMENT,
        },
      ];
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockResponses)
      );

      // Act
      const results = await agent.generateAllDocuments(
        'session-123',
        mockCompanyFormationData
      );

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].documentType).toBe(DocumentType.ARTICLES_OF_ORGANIZATION);
      expect(results[1].documentType).toBe(DocumentType.OPERATING_AGREEMENT);
    });

    it('should generate all required C-Corp documents', async () => {
      // Arrange
      const mockResponses = [
        {
          ...mockDocumentGenerationResponse,
          documentType: DocumentType.CERTIFICATE_OF_INCORPORATION,
        },
        {
          ...mockDocumentGenerationResponse,
          documentId: 'doc-456',
          documentType: DocumentType.BYLAWS,
        },
        {
          ...mockDocumentGenerationResponse,
          documentId: 'doc-789',
          documentType: DocumentType.STOCK_CERTIFICATE,
        },
      ];
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockResponses)
      );

      // Act
      const results = await agent.generateAllDocuments(
        'session-123',
        mockCompanyFormationDataCCorp
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(
        results.some((r) => r.documentType === DocumentType.CERTIFICATE_OF_INCORPORATION)
      ).toBe(true);
      expect(results.some((r) => r.documentType === DocumentType.BYLAWS)).toBe(true);
      expect(
        results.some((r) => r.documentType === DocumentType.STOCK_CERTIFICATE)
      ).toBe(true);
    });
  });

  describe('getGenerationProgress', () => {
    it('should get document generation progress', async () => {
      // Arrange
      const mockProgress = {
        status: DocumentStatus.GENERATING,
        progress: 60,
        currentStep: 'Filling form fields',
        message: 'Generating document...',
        estimatedTimeRemaining: 15,
      };
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockProgress)
      );

      // Act
      const result = await agent.getGenerationProgress('doc-123');

      // Assert
      expect(result.progress).toBe(60);
      expect(result.status).toBe(DocumentStatus.GENERATING);
      expect(result.currentStep).toBe('Filling form fields');
    });
  });

  describe('downloadDocument', () => {
    it('should download generated document as buffer', async () => {
      // Arrange
      const mockPdfBuffer = Buffer.from('PDF content');
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockPdfBuffer,
      });

      // Act
      const result = await agent.downloadDocument('doc-123');

      // Assert
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/v1/documents/doc-123/download',
        expect.objectContaining({
          responseType: 'arraybuffer',
        })
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('should get pre-signed download URL', async () => {
      // Arrange
      const mockUrlResponse = {
        url: 'https://storage.example.com/doc-123.pdf?signature=abc123',
        expiresAt: '2024-01-02T00:00:00.000Z',
      };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockUrlResponse)
      );

      // Act
      const url = await agent.getDownloadUrl('doc-123');

      // Assert
      expect(url).toContain('https://storage.example.com');
      expect(url).toContain('signature=');
    });

    it('should support custom expiry time', async () => {
      // Arrange
      const mockUrlResponse = {
        url: 'https://storage.example.com/doc-123.pdf',
        expiresAt: '2024-01-02T00:00:00.000Z',
      };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockUrlResponse)
      );

      // Act
      await agent.getDownloadUrl('doc-123', 7200); // 2 hours

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/documents/doc-123/download-url',
        { expiresInSeconds: 7200 },
        expect.any(Object)
      );
    });
  });

  describe('validateDocumentData', () => {
    it('should validate data before generation', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({ valid: true })
      );

      // Act
      const result = await agent.validateDocumentData(
        mockCompanyFormationData,
        DocumentType.ARTICLES_OF_ORGANIZATION
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/documents/validate',
        expect.any(Object),
        expect.objectContaining({
          skipRetry: true,
        })
      );
    });

    it('should return validation errors', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({
          valid: false,
          errors: ['Company name is required', 'At least one shareholder required'],
        })
      );

      // Act
      const result = await agent.validateDocumentData(
        { ...mockCompanyFormationData, companyName: undefined },
        DocumentType.ARTICLES_OF_ORGANIZATION
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('areDocumentsReady', () => {
    it('should return true when all documents completed', async () => {
      // Arrange
      const mockDocs = [
        { ...mockDocumentGenerationResponse, status: DocumentStatus.COMPLETED },
        {
          ...mockDocumentGenerationResponse,
          documentId: 'doc-456',
          status: DocumentStatus.COMPLETED,
        },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockDocs)
      );

      // Act
      const result = await agent.areDocumentsReady('session-123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when documents still generating', async () => {
      // Arrange
      const mockDocs = [
        { ...mockDocumentGenerationResponse, status: DocumentStatus.COMPLETED },
        {
          ...mockDocumentGenerationResponse,
          documentId: 'doc-456',
          status: DocumentStatus.GENERATING,
        },
      ];
      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse(mockDocs)
      );

      // Act
      const result = await agent.areDocumentsReady('session-123');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('cancelGeneration', () => {
    it('should cancel document generation', async () => {
      // Arrange
      mockAxiosInstance.delete.mockResolvedValueOnce(
        createMockAxiosResponse({})
      );

      // Act
      await agent.cancelGeneration('doc-123');

      // Assert
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/api/v1/documents/doc-123',
        expect.any(Object)
      );
    });
  });

  describe('regenerateDocument', () => {
    it('should regenerate document with updates', async () => {
      // Arrange
      const updatedData = {
        companyName: 'Updated Company LLC',
      };
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({
          ...mockDocumentGenerationResponse,
          documentId: 'doc-new-123',
        })
      );

      // Act
      const result = await agent.regenerateDocument('doc-123', updatedData);

      // Assert
      expect(result.documentId).toBe('doc-new-123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/documents/doc-123/regenerate',
        { updatedData },
        expect.any(Object)
      );
    });
  });
});
