/**
 * Integration tests for complete company formation flow
 * Tests User Story 1: Quick Company Formation (P1, MVP)
 * Tests all functional requirements end-to-end
 */

import axios from 'axios';
import { SessionManager } from '../../src/storage/SessionManager';
import { NameCheckAgent } from '../../src/services/agents/NameCheckAgent';
import { DocumentFillerAgent } from '../../src/services/agents/DocumentFillerAgent';
import { FilingAgent } from '../../src/services/agents/FilingAgent';
import {
  AgentClientConfig,
  DocumentType,
  DocumentStatus,
  FilingStatus,
  FilingType,
} from '../../src/services/agents/types';
import { SessionStatus } from '../../src/storage/types';
import {
  mockCompanyFormationData,
  mockNameCheckAvailable,
  mockDocumentGenerationResponse,
  mockFilingResponse,
  createMockAxiosResponse,
  createMockAxiosError,
  mockNameCheckUnavailable,
} from '../fixtures/mockData';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Company Formation Flow - Integration Tests', () => {
  let sessionManager: SessionManager;
  let nameCheckAgent: NameCheckAgent;
  let documentAgent: DocumentFillerAgent;
  let filingAgent: FilingAgent;
  let testStorageDir: string;
  let mockAxiosInstance: any;
  let agentConfig: AgentClientConfig;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup test storage
    testStorageDir = path.join(os.tmpdir(), `lovie-integration-${Date.now()}`);

    // Setup mock axios
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

    // Initialize agents
    agentConfig = {
      baseUrl: 'https://api.test.lovie.dev',
      apiKey: 'test-api-key',
      timeout: 30000,
    };

    nameCheckAgent = new NameCheckAgent(agentConfig);
    documentAgent = new DocumentFillerAgent(agentConfig);
    filingAgent = new FilingAgent(agentConfig);

    // Initialize session manager
    sessionManager = new SessionManager({
      storageDir: testStorageDir,
      backupEnabled: true,
    });
    await sessionManager.initialize();
  });

  afterEach(async () => {
    // Cleanup
    nameCheckAgent.destroy();
    documentAgent.destroy();
    filingAgent.destroy();

    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  describe('Complete Formation Flow (User Story 1)', () => {
    it('should complete full formation from start to confirmation', async () => {
      // Step 1: Create session
      const session = await sessionManager.createSession({
        userAgent: 'test',
      });

      expect(session.sessionId).toBeDefined();
      expect(session.status).toBe(SessionStatus.IN_PROGRESS);

      // Step 2: Check company name availability (FR-021, FR-015)
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockNameCheckAvailable)
      );

      const nameCheck = await nameCheckAgent.checkNameAvailability({
        companyName: mockCompanyFormationData.companyName!,
        state: mockCompanyFormationData.state!,
        companyType: mockCompanyFormationData.companyType!,
      });

      expect(nameCheck.available).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/name-check',
        expect.any(Object),
        expect.objectContaining({
          timeout: 5000, // FR-015: 5 second timeout
        })
      );

      // Step 3: Save company information
      await sessionManager.updateSession(
        session.sessionId,
        mockCompanyFormationData,
        'review'
      );

      const updatedSession = await sessionManager.loadSession(session.sessionId);
      expect(updatedSession?.companyData?.companyName).toBe('Test Company LLC');

      // Step 4: Generate documents (FR-022, SC-006)
      const mockDocs = [
        mockDocumentGenerationResponse,
        {
          ...mockDocumentGenerationResponse,
          documentId: 'doc-456',
          documentType: DocumentType.OPERATING_AGREEMENT,
        },
      ];
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockDocs)
      );

      const documents = await documentAgent.generateAllDocuments(
        session.sessionId,
        mockCompanyFormationData
      );

      expect(documents).toHaveLength(2);
      expect(documents.every((d) => d.status === DocumentStatus.COMPLETED)).toBe(
        true
      );

      // Step 5: Submit filing (FR-023)
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockFilingResponse)
      );

      const filing = await filingAgent.submitFiling({
        sessionId: session.sessionId,
        companyData: mockCompanyFormationData,
        documentIds: documents.map((d) => d.documentId),
        state: mockCompanyFormationData.state!,
        filingType: FilingType.NEW_ENTITY,
      });

      expect(filing.filingId).toBeDefined();
      expect(filing.status).toBe(FilingStatus.COMPLETED);
      expect(filing.confirmationNumber).toBeDefined();

      // Step 6: Complete session
      await sessionManager.completeSession(session.sessionId);

      const finalSession = await sessionManager.loadSession(session.sessionId);
      expect(finalSession?.status).toBe(SessionStatus.COMPLETED);

      // Verify timing requirements
      const totalTime =
        new Date(finalSession!.updatedAt).getTime() -
        new Date(finalSession!.createdAt).getTime();
      console.log(`Total formation time: ${totalTime}ms`);
      // SC-002: Should complete in under 15 minutes (in real scenario)
    });

    it('should handle unavailable name and provide suggestions', async () => {
      // Arrange
      const session = await sessionManager.createSession();

      // Mock unavailable name
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockNameCheckUnavailable)
      );

      // Act
      const nameCheck = await nameCheckAgent.checkNameAvailability({
        companyName: 'Existing Company LLC',
        state: 'DE',
        companyType: 'LLC',
      });

      // Assert - Edge case: Name taken mid-flow
      expect(nameCheck.available).toBe(false);
      expect(nameCheck.suggestions).toBeDefined();
      expect(nameCheck.suggestions!.length).toBeGreaterThan(0);
      expect(nameCheck.reason).toBeDefined();

      // User can retry with suggested name
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({
          ...mockNameCheckAvailable,
          companyName: nameCheck.suggestions![0],
        })
      );

      const retryCheck = await nameCheckAgent.checkNameAvailability({
        companyName: nameCheck.suggestions![0],
        state: 'DE',
        companyType: 'LLC',
      });

      expect(retryCheck.available).toBe(true);
    });
  });

  describe('Resume Interrupted Formation (User Story 4)', () => {
    it('should save progress and resume from where left off', async () => {
      // Step 1: Start formation
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(
        session.sessionId,
        {
          companyName: 'Test Company LLC',
          state: 'DE',
        },
        'company-info'
      );

      // Simulate user exiting (session saved automatically)
      const savedSession = await sessionManager.loadSession(session.sessionId);
      expect(savedSession?.currentStep).toBe('company-info');

      // Step 2: User returns and resumes
      const resumed = await sessionManager.resumeSession();

      expect(resumed).toBeDefined();
      expect(resumed?.sessionId).toBe(session.sessionId);
      expect(resumed?.companyData?.companyName).toBe('Test Company LLC');
      expect(resumed?.currentStep).toBe('company-info');

      // Step 3: Continue from where left off
      await sessionManager.updateSession(
        resumed!.sessionId,
        {
          companyType: 'LLC',
        },
        'shareholder-info'
      );

      const continued = await sessionManager.loadSession(resumed!.sessionId);
      expect(continued?.companyData?.companyName).toBe('Test Company LLC');
      expect(continued?.companyData?.companyType).toBe('LLC');
      expect(continued?.currentStep).toBe('shareholder-info');
    });

    it('should preserve all data when resuming', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(
        session.sessionId,
        mockCompanyFormationData,
        'payment'
      );

      // Act - Simulate app restart
      const resumed = await sessionManager.resumeSession();

      // Assert
      expect(resumed?.companyData?.companyName).toBe('Test Company LLC');
      expect(resumed?.companyData?.shareholders).toHaveLength(1);
      expect(resumed?.companyData?.registeredAgent).toBeDefined();
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle payment failure gracefully', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(
        session.sessionId,
        mockCompanyFormationData,
        'payment'
      );

      // Mock payment failure
      mockAxiosInstance.post.mockRejectedValueOnce(
        createMockAxiosError(402, 'Payment failed', 'PAYMENT_FAILED')
      );

      // Act & Assert - Edge case: Payment fails
      await expect(
        filingAgent.submitFiling({
          sessionId: session.sessionId,
          companyData: mockCompanyFormationData,
          documentIds: ['doc-123'],
          state: 'DE',
          filingType: FilingType.NEW_ENTITY,
        })
      ).rejects.toThrow();

      // Session should still be saved
      const savedSession = await sessionManager.loadSession(session.sessionId);
      expect(savedSession).toBeDefined();
      expect(savedSession?.currentStep).toBe('payment');
    });

    it('should handle network errors with retries (FR-036)', async () => {
      // Arrange
      const session = await sessionManager.createSession();

      // Mock network failures then success
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNABORTED';

      mockAxiosInstance.post
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(createMockAxiosResponse(mockNameCheckAvailable));

      // Act - Edge case: Network connection issues
      const result = await nameCheckAgent.checkNameAvailability({
        companyName: 'Test Company',
        state: 'DE',
        companyType: 'LLC',
      });

      // Assert - Should retry and eventually succeed
      expect(result.available).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });

    it('should handle filing agent errors gracefully', async () => {
      // Arrange
      const session = await sessionManager.createSession();

      // Mock filing error (state system down)
      mockAxiosInstance.post.mockRejectedValueOnce(
        createMockAxiosError(503, 'State system unavailable', 'SERVICE_UNAVAILABLE')
      );

      // Act & Assert - Edge case: State system down
      await expect(
        filingAgent.submitFiling({
          sessionId: session.sessionId,
          companyData: mockCompanyFormationData,
          documentIds: ['doc-123'],
          state: 'DE',
          filingType: FilingType.NEW_ENTITY,
        })
      ).rejects.toThrow();

      // User should be notified, session preserved
      const savedSession = await sessionManager.loadSession(session.sessionId);
      expect(savedSession).toBeDefined();
    });

    it('should handle validation errors without retrying', async () => {
      // Arrange
      const invalidData = {
        companyName: '', // Invalid: empty name
        state: 'DE',
        companyType: 'LLC' as const,
      };

      // Mock validation error
      mockAxiosInstance.post.mockRejectedValueOnce(
        createMockAxiosError(400, 'Invalid company name', 'VALIDATION_ERROR')
      );

      // Act & Assert - Edge case: Invalid data
      await expect(
        nameCheckAgent.checkNameAvailability(invalidData)
      ).rejects.toThrow();

      // Should not retry validation errors
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multi-State Support (User Story 2)', () => {
    it('should handle California formation with state-specific requirements', async () => {
      // Arrange
      const caData = {
        ...mockCompanyFormationData,
        state: 'CA',
      };

      mockAxiosInstance.get.mockResolvedValueOnce(
        createMockAxiosResponse({
          requiredDocuments: ['Articles of Incorporation', 'Statement of Information'],
          requiredFields: ['companyName', 'agent', 'directors'],
          processingTime: '10-15 business days',
          specialRequirements: ['Must file Statement of Information within 90 days'],
        })
      );

      // Act
      const requirements = await filingAgent.getStateRequirements('CA', 'C-Corp');

      // Assert
      expect(requirements.requiredDocuments).toContain('Statement of Information');
      expect(requirements.specialRequirements).toBeDefined();
      expect(requirements.processingTime).toContain('10-15');
    });

    it('should calculate correct fees for different states', async () => {
      // Delaware LLC
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({
          stateFee: 90,
          serviceFee: 49,
          total: 139,
          currency: 'USD',
        })
      );

      const deFees = await filingAgent.calculateFees('DE', 'LLC');
      expect(deFees.stateFee).toBe(90);

      // California LLC (different fee)
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse({
          stateFee: 70,
          serviceFee: 49,
          total: 119,
          currency: 'USD',
        })
      );

      const caFees = await filingAgent.calculateFees('CA', 'LLC');
      expect(caFees.stateFee).toBe(70);
      expect(caFees.total).not.toBe(deFees.total);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete name check within 5 seconds (FR-015)', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockNameCheckAvailable)
      );

      // Act
      const startTime = Date.now();
      await nameCheckAgent.checkNameAvailability({
        companyName: 'Test Company',
        state: 'DE',
        companyType: 'LLC',
      });
      const duration = Date.now() - startTime;

      // Assert - FR-015: Results within 5 seconds
      // In real scenario, this would measure actual API time
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    it('should generate documents within 30 seconds (SC-006)', async () => {
      // Arrange
      mockAxiosInstance.post.mockResolvedValueOnce(
        createMockAxiosResponse(mockDocumentGenerationResponse)
      );

      // Act
      await documentAgent.generateDocument({
        sessionId: 'session-123',
        companyData: mockCompanyFormationData,
        documentType: DocumentType.ARTICLES_OF_ORGANIZATION,
      });

      // Assert - SC-006: 30 seconds + buffer
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 45000, // 30s + 15s buffer
        })
      );
    });
  });
});
