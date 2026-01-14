/**
 * Unit Tests - Document Filler Agent
 * Tests the document generation service
 */

import {
  mockDocumentFillerAgent,
  DocumentFillerRequest,
} from '../../mocks/agent-api.mock';
import {
  validLLCData,
  validCCorpData,
  validSCorpData,
} from '../../fixtures/company-data.fixture';

describe('Document Filler Agent', () => {
  describe('generateDocuments', () => {
    it('should generate LLC documents correctly', async () => {
      const request: DocumentFillerRequest = validLLCData;

      const result = await mockDocumentFillerAgent.generateDocuments(request);

      expect(result.documentId).toBeDefined();
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0].name).toBe('Articles of Organization');
      expect(result.documents[1].name).toBe('Operating Agreement');
      expect(result.generatedAt).toBeDefined();
    });

    it('should generate C-Corp documents correctly', async () => {
      const request: DocumentFillerRequest = validCCorpData as any;

      const result = await mockDocumentFillerAgent.generateDocuments(request);

      expect(result.documentId).toBeDefined();
      expect(result.documents).toHaveLength(2);
      expect(result.documents[0].name).toBe('Certificate of Incorporation');
      expect(result.documents[1].name).toBe('Corporate Bylaws');
    });

    it('should generate S-Corp documents with Form 2553', async () => {
      const request: DocumentFillerRequest = validSCorpData;

      const result = await mockDocumentFillerAgent.generateDocuments(request);

      expect(result.documentId).toBeDefined();
      expect(result.documents).toHaveLength(3);
      expect(result.documents[2].name).toBe('S-Corp Election Form 2553');
    });

    it('should complete document generation within 30 seconds (SC-006)', async () => {
      const request: DocumentFillerRequest = validLLCData;
      const startTime = Date.now();

      await mockDocumentFillerAgent.generateDocuments(request);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    });

    it('should generate valid PDF URLs for all documents', async () => {
      const request: DocumentFillerRequest = validLLCData;

      const result = await mockDocumentFillerAgent.generateDocuments(request);

      result.documents.forEach((doc) => {
        expect(doc.url).toMatch(/^https:\/\/storage\.lovie\.io\/documents\//);
        expect(doc.url).toContain('.pdf');
        expect(doc.type).toBe('pdf');
      });
    });

    it('should generate unique document IDs for each request', async () => {
      const request: DocumentFillerRequest = validLLCData;

      const result1 = await mockDocumentFillerAgent.generateDocuments(request);
      const result2 = await mockDocumentFillerAgent.generateDocuments(request);

      expect(result1.documentId).not.toBe(result2.documentId);
    });

    it('should include timestamp in ISO format', async () => {
      const request: DocumentFillerRequest = validLLCData;

      const result = await mockDocumentFillerAgent.generateDocuments(request);

      expect(result.generatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum number of shareholders (100)', async () => {
      const request: DocumentFillerRequest = {
        companyName: 'Many Owners LLC',
        companyType: 'LLC',
        state: 'Delaware',
        shareholders: Array.from({ length: 100 }, (_, i) => ({
          name: `Shareholder ${i + 1}`,
          address: `${i + 1} Test St`,
          ownershipPercentage: 1,
          ssn: `${String(i).padStart(3, '0')}-45-6789`,
        })),
        registeredAgent: {
          name: 'Test Agent',
          address: '789 Market St',
          contact: 'agent@example.com',
        },
      };

      const result = await mockDocumentFillerAgent.generateDocuments(request);

      expect(result.documentId).toBeDefined();
      expect(result.documents.length).toBeGreaterThan(0);
    });

    it('should handle special characters in company names', async () => {
      const request: DocumentFillerRequest = {
        ...validLLCData,
        companyName: "O'Reilly & Associates, LLC",
      };

      const result = await mockDocumentFillerAgent.generateDocuments(request);

      expect(result.documentId).toBeDefined();
    });

    it('should handle mixed SSN and EIN shareholders', async () => {
      const request: DocumentFillerRequest = {
        ...validLLCData,
        shareholders: [
          {
            name: 'Individual Owner',
            address: '123 Main St',
            ownershipPercentage: 50,
            ssn: '123-45-6789',
          },
          {
            name: 'Corporate Owner LLC',
            address: '456 Oak Ave',
            ownershipPercentage: 50,
            ein: '12-3456789',
          },
        ],
      };

      const result = await mockDocumentFillerAgent.generateDocuments(request);

      expect(result.documentId).toBeDefined();
      expect(result.documents).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown company type', async () => {
      const request: any = {
        ...validLLCData,
        companyType: 'Unknown',
      };

      await expect(
        mockDocumentFillerAgent.generateDocuments(request)
      ).rejects.toThrow('Unknown company type');
    });
  });
});
