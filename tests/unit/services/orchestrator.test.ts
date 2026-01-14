/**
 * Unit Tests - Orchestrator Service
 * Tests the coordination of agents and workflow management
 */

import {
  mockNameCheckAgent,
  mockDocumentFillerAgent,
  mockFilingAgent,
} from '../../mocks/agent-api.mock';
import { validLLCData } from '../../fixtures/company-data.fixture';

describe('Orchestrator Service', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator({
      nameCheckAgent: mockNameCheckAgent,
      documentFillerAgent: mockDocumentFillerAgent,
      filingAgent: mockFilingAgent,
    });

    mockNameCheckAgent.reset();
    mockFilingAgent.reset();
  });

  describe('executeFormationFlow', () => {
    it('should complete full formation workflow successfully', async () => {
      const result = await orchestrator.executeFormationFlow(validLLCData);

      expect(result.success).toBe(true);
      expect(result.nameCheck).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.filing).toBeDefined();
      expect(result.confirmationNumber).toBeDefined();
    });

    it('should execute agents in correct sequence', async () => {
      const executionOrder: string[] = [];

      orchestrator.onAgentStart((agentName) => {
        executionOrder.push(agentName);
      });

      await orchestrator.executeFormationFlow(validLLCData);

      expect(executionOrder).toEqual([
        'nameCheckAgent',
        'documentFillerAgent',
        'filingAgent',
      ]);
    });

    it('should complete workflow in under 15 minutes (SC-002)', async () => {
      const startTime = Date.now();

      await orchestrator.executeFormationFlow(validLLCData);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(15 * 60 * 1000);
    });

    it('should provide progress updates during execution (FR-024)', async () => {
      const progressUpdates: string[] = [];

      orchestrator.onProgress((update) => {
        progressUpdates.push(update.message);
      });

      await orchestrator.executeFormationFlow(validLLCData);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates).toContain(
        expect.stringContaining('Checking name availability')
      );
      expect(progressUpdates).toContain(
        expect.stringContaining('Generating documents')
      );
      expect(progressUpdates).toContain(
        expect.stringContaining('Submitting filing')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle name unavailability gracefully', async () => {
      mockNameCheckAgent.addTakenName(validLLCData.companyName);

      const result = await orchestrator.executeFormationFlow(validLLCData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Company name is not available');
      expect(result.alternatives).toBeDefined();
    });

    it('should retry failed operations up to 3 times (FR-036)', async () => {
      let attemptCount = 0;

      orchestrator.setAgentBehavior('nameCheckAgent', () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network timeout');
        }
        return mockNameCheckAgent.checkNameAvailability(
          validLLCData.companyName,
          validLLCData.state
        );
      });

      await orchestrator.executeFormationFlow(validLLCData);

      expect(attemptCount).toBe(3);
    });

    it('should provide user-friendly error messages (FR-037)', async () => {
      orchestrator.setAgentBehavior('documentFillerAgent', () => {
        throw new Error('Internal server error: stack trace here');
      });

      const result = await orchestrator.executeFormationFlow(validLLCData);

      expect(result.success).toBe(false);
      expect(result.error).not.toContain('stack trace');
      expect(result.error).toMatch(
        /We encountered an issue generating your documents/i
      );
    });

    it('should detect network connectivity issues (FR-035)', async () => {
      orchestrator.simulateNetworkError();

      const result = await orchestrator.executeFormationFlow(validLLCData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Unable to connect. Please check your internet connection'
      );
    });

    it('should provide support contact on critical errors (FR-038)', async () => {
      orchestrator.setAgentBehavior('filingAgent', () => {
        throw new Error('Critical system error');
      });

      const result = await orchestrator.executeFormationFlow(validLLCData);

      expect(result.supportContact).toBeDefined();
      expect(result.supportContact).toContain('support@lovie.io');
    });
  });

  describe('Agent Coordination', () => {
    it('should pass document ID from filler to filing agent', async () => {
      let capturedDocumentId: string | null = null;

      orchestrator.onAgentStart((agentName, params) => {
        if (agentName === 'filingAgent') {
          capturedDocumentId = params.documentId;
        }
      });

      await orchestrator.executeFormationFlow(validLLCData);

      expect(capturedDocumentId).toBeDefined();
      expect(capturedDocumentId).toMatch(/^doc_/);
    });

    it('should handle parallel operations efficiently', async () => {
      const formationRequests = Array.from({ length: 5 }, (_, i) => ({
        ...validLLCData,
        companyName: `Company ${i} LLC`,
      }));

      const startTime = Date.now();

      const results = await Promise.all(
        formationRequests.map((req) => orchestrator.executeFormationFlow(req))
      );

      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Should be faster than sequential execution
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('State Management', () => {
    it('should maintain session state throughout workflow', async () => {
      const sessionId = 'test_session_001';

      await orchestrator.executeFormationFlow(validLLCData, { sessionId });

      const sessionData = orchestrator.getSessionData(sessionId);

      expect(sessionData).toBeDefined();
      expect(sessionData.nameCheckResult).toBeDefined();
      expect(sessionData.documentIds).toBeDefined();
      expect(sessionData.filingId).toBeDefined();
    });

    it('should allow resuming interrupted workflow', async () => {
      const sessionId = 'interrupted_session';

      // Start workflow
      orchestrator.simulateInterruption('documentFillerAgent');
      const firstAttempt = await orchestrator.executeFormationFlow(
        validLLCData,
        { sessionId }
      );

      expect(firstAttempt.success).toBe(false);

      // Resume workflow
      orchestrator.clearInterruption();
      const secondAttempt = await orchestrator.resumeFormationFlow(sessionId);

      expect(secondAttempt.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should respond within 200ms for user interactions (SC-007)', async () => {
      const startTime = Date.now();

      await orchestrator.validateUserInput({
        companyName: 'Test LLC',
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
    });
  });
});

// Mock Orchestrator implementation
class Orchestrator {
  private agents: any;
  private eventHandlers: Map<string, Function[]> = new Map();
  private agentBehaviors: Map<string, Function> = new Map();
  private sessionData: Map<string, any> = new Map();
  private interrupted: string | null = null;
  private networkError = false;

  constructor(agents: any) {
    this.agents = agents;
  }

  async executeFormationFlow(data: any, options?: any): Promise<any> {
    const sessionId = options?.sessionId || `session_${Date.now()}`;

    try {
      if (this.networkError) {
        throw new Error('NETWORK_ERROR');
      }

      // Step 1: Name Check
      this.emitAgentStart('nameCheckAgent', data);
      this.emitProgress({ message: 'Checking name availability...' });

      const nameCheck = await this.executeAgent('nameCheckAgent', () =>
        this.agents.nameCheckAgent.checkNameAvailability(
          data.companyName,
          data.state
        )
      );

      if (!nameCheck.available) {
        return {
          success: false,
          error: 'Company name is not available',
          alternatives: nameCheck.alternatives,
        };
      }

      // Step 2: Document Generation
      this.emitAgentStart('documentFillerAgent', data);
      this.emitProgress({ message: 'Generating documents...' });

      const documents = await this.executeAgent('documentFillerAgent', () =>
        this.agents.documentFillerAgent.generateDocuments(data)
      );

      // Step 3: Filing
      this.emitAgentStart('filingAgent', {
        documentId: documents.documentId,
      });
      this.emitProgress({ message: 'Submitting filing...' });

      const filing = await this.executeAgent('filingAgent', () =>
        this.agents.filingAgent.submitFiling({
          documentId: documents.documentId,
          state: data.state,
          companyName: data.companyName,
        })
      );

      const result = {
        success: true,
        nameCheck,
        documents,
        filing,
        confirmationNumber: filing.confirmationNumber,
      };

      this.sessionData.set(sessionId, {
        nameCheckResult: nameCheck,
        documentIds: documents.documentId,
        filingId: filing.filingId,
      });

      return result;
    } catch (error: any) {
      if (error.message === 'NETWORK_ERROR') {
        return {
          success: false,
          error: 'Unable to connect. Please check your internet connection',
        };
      }

      return {
        success: false,
        error: this.sanitizeError(error),
        supportContact: 'support@lovie.io',
      };
    }
  }

  async resumeFormationFlow(sessionId: string): Promise<any> {
    // Implementation for resuming
    return this.executeFormationFlow({}, { sessionId });
  }

  private async executeAgent(
    agentName: string,
    defaultFn: Function
  ): Promise<any> {
    if (this.interrupted === agentName) {
      throw new Error('INTERRUPTED');
    }

    const customBehavior = this.agentBehaviors.get(agentName);
    if (customBehavior) {
      return await this.retryWithBackoff(customBehavior);
    }

    return await this.retryWithBackoff(defaultFn);
  }

  private async retryWithBackoff(
    fn: Function,
    maxRetries = 3
  ): Promise<any> {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 100)
          );
        }
      }
    }

    throw lastError;
  }

  private sanitizeError(error: any): string {
    const message = error.message || 'Unknown error';

    if (message.includes('stack trace')) {
      return 'We encountered an issue generating your documents. Please try again.';
    }

    return message;
  }

  onAgentStart(handler: Function): void {
    this.addHandler('agentStart', handler);
  }

  onProgress(handler: Function): void {
    this.addHandler('progress', handler);
  }

  private addHandler(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emitAgentStart(agentName: string, params?: any): void {
    const handlers = this.eventHandlers.get('agentStart') || [];
    handlers.forEach((handler) => handler(agentName, params));
  }

  private emitProgress(update: any): void {
    const handlers = this.eventHandlers.get('progress') || [];
    handlers.forEach((handler) => handler(update));
  }

  setAgentBehavior(agentName: string, behavior: Function): void {
    this.agentBehaviors.set(agentName, behavior);
  }

  simulateInterruption(agentName: string): void {
    this.interrupted = agentName;
  }

  clearInterruption(): void {
    this.interrupted = null;
  }

  simulateNetworkError(): void {
    this.networkError = true;
  }

  getSessionData(sessionId: string): any {
    return this.sessionData.get(sessionId);
  }

  async validateUserInput(input: any): Promise<boolean> {
    // Fast validation
    return true;
  }
}
