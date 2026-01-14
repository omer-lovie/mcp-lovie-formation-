/**
 * Unit Tests - Filing Agent
 * Tests the state filing submission service
 */

import { mockFilingAgent, FilingRequest } from '../../mocks/agent-api.mock';

describe('Filing Agent', () => {
  beforeEach(() => {
    mockFilingAgent.reset();
  });

  describe('submitFiling', () => {
    it('should submit filing successfully', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
      };

      const result = await mockFilingAgent.submitFiling(request);

      expect(result.filingId).toBeDefined();
      expect(result.status).toBe('submitted');
      expect(result.confirmationNumber).toBeDefined();
      expect(result.filingDate).toBeDefined();
      expect(result.estimatedCompletionDate).toBeDefined();
    });

    it('should generate unique filing IDs', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
      };

      const result1 = await mockFilingAgent.submitFiling(request);
      const result2 = await mockFilingAgent.submitFiling(request);

      expect(result1.filingId).not.toBe(result2.filingId);
    });

    it('should generate unique confirmation numbers', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
      };

      const result1 = await mockFilingAgent.submitFiling(request);
      const result2 = await mockFilingAgent.submitFiling(request);

      expect(result1.confirmationNumber).not.toBe(result2.confirmationNumber);
    });

    it('should set standard completion date to 7 days', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
        expedited: false,
      };

      const result = await mockFilingAgent.submitFiling(request);

      const filingDate = new Date(result.filingDate!);
      const completionDate = new Date(result.estimatedCompletionDate!);
      const daysDiff = Math.floor(
        (completionDate.getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(7);
    });

    it('should set expedited completion date to 2 days', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
        expedited: true,
      };

      const result = await mockFilingAgent.submitFiling(request);

      const filingDate = new Date(result.filingDate!);
      const completionDate = new Date(result.estimatedCompletionDate!);
      const daysDiff = Math.floor(
        (completionDate.getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(2);
    });
  });

  describe('getFilingStatus', () => {
    it('should retrieve filing status by ID', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
      };

      const submitResult = await mockFilingAgent.submitFiling(request);
      const statusResult = await mockFilingAgent.getFilingStatus(
        submitResult.filingId
      );

      expect(statusResult.filingId).toBe(submitResult.filingId);
      expect(statusResult.status).toBe('submitted');
    });

    it('should throw error for non-existent filing ID', async () => {
      await expect(
        mockFilingAgent.getFilingStatus('non_existent_id')
      ).rejects.toThrow('Filing not found');
    });

    it('should reflect status updates', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
      };

      const submitResult = await mockFilingAgent.submitFiling(request);

      mockFilingAgent.approveFiling(submitResult.filingId);

      const statusResult = await mockFilingAgent.getFilingStatus(
        submitResult.filingId
      );

      expect(statusResult.status).toBe('approved');
    });
  });

  describe('Status Management', () => {
    it('should allow approving a filing', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
      };

      const result = await mockFilingAgent.submitFiling(request);
      mockFilingAgent.approveFiling(result.filingId);

      const status = await mockFilingAgent.getFilingStatus(result.filingId);
      expect(status.status).toBe('approved');
    });

    it('should allow rejecting a filing', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Test Company LLC',
      };

      const result = await mockFilingAgent.submitFiling(request);
      mockFilingAgent.rejectFiling(result.filingId);

      const status = await mockFilingAgent.getFilingStatus(result.filingId);
      expect(status.status).toBe('rejected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple concurrent filings', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        documentId: `doc_test_${i}`,
        state: 'Delaware',
        companyName: `Test Company ${i} LLC`,
      }));

      const promises = requests.map((req) => mockFilingAgent.submitFiling(req));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      const filingIds = results.map((r) => r.filingId);
      const uniqueIds = new Set(filingIds);
      expect(uniqueIds.size).toBe(10);
    });

    it('should handle special characters in company names', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: "O'Reilly & Associates, LLC",
      };

      const result = await mockFilingAgent.submitFiling(request);
      expect(result.filingId).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete filing submission quickly', async () => {
      const request: FilingRequest = {
        documentId: 'doc_test_001',
        state: 'Delaware',
        companyName: 'Performance Test LLC',
      };

      const startTime = Date.now();
      await mockFilingAgent.submitFiling(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });
  });
});
