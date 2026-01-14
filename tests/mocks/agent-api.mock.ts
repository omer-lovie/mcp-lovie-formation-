/**
 * Mock Backend Agent APIs
 * Provides mock implementations for Name Check, Document Filler, and Filing Agents
 */

export interface NameCheckResponse {
  available: boolean;
  companyName: string;
  state: string;
  alternatives?: string[];
  checkedAt: string;
}

export interface DocumentFillerRequest {
  companyName: string;
  companyType: 'LLC' | 'C-Corp' | 'S-Corp';
  state: string;
  shareholders: Array<{
    name: string;
    address: string;
    ownershipPercentage: number;
    ssn?: string;
    ein?: string;
  }>;
  registeredAgent: {
    name: string;
    address: string;
    contact: string;
  };
}

export interface DocumentFillerResponse {
  documentId: string;
  documents: Array<{
    name: string;
    url: string;
    type: 'pdf';
  }>;
  generatedAt: string;
}

export interface FilingRequest {
  documentId: string;
  state: string;
  companyName: string;
  expedited?: boolean;
}

export interface FilingResponse {
  filingId: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  confirmationNumber?: string;
  filingDate?: string;
  estimatedCompletionDate?: string;
}

/**
 * Mock Name Check Agent
 */
export class MockNameCheckAgent {
  private takenNames: Set<string> = new Set([
    'Acme LLC',
    'Test Company LLC',
    'Existing Business Inc',
  ]);

  async checkNameAvailability(
    companyName: string,
    state: string
  ): Promise<NameCheckResponse> {
    // Simulate network delay
    await this.delay(500);

    const available = !this.takenNames.has(companyName);

    return {
      available,
      companyName,
      state,
      alternatives: available ? [] : this.generateAlternatives(companyName),
      checkedAt: new Date().toISOString(),
    };
  }

  private generateAlternatives(name: string): string[] {
    return [
      `${name} Holdings`,
      `${name} Group`,
      `${name} Ventures`,
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Test helper: add name to taken list
  addTakenName(name: string): void {
    this.takenNames.add(name);
  }

  // Test helper: remove name from taken list
  removeTakenName(name: string): void {
    this.takenNames.delete(name);
  }

  // Test helper: reset to default state
  reset(): void {
    this.takenNames = new Set([
      'Acme LLC',
      'Test Company LLC',
      'Existing Business Inc',
    ]);
  }
}

/**
 * Mock Document Filler Agent
 */
export class MockDocumentFillerAgent {
  async generateDocuments(
    request: DocumentFillerRequest
  ): Promise<DocumentFillerResponse> {
    // Simulate document generation delay
    await this.delay(1000);

    const documentId = this.generateId();
    const documents = this.getDocumentsForType(request.companyType);

    return {
      documentId,
      documents,
      generatedAt: new Date().toISOString(),
    };
  }

  private getDocumentsForType(type: string): Array<{ name: string; url: string; type: 'pdf' }> {
    const baseUrl = 'https://storage.lovie.io/documents';
    const docId = this.generateId();

    switch (type) {
      case 'LLC':
        return [
          {
            name: 'Articles of Organization',
            url: `${baseUrl}/${docId}/articles-of-organization.pdf`,
            type: 'pdf',
          },
          {
            name: 'Operating Agreement',
            url: `${baseUrl}/${docId}/operating-agreement.pdf`,
            type: 'pdf',
          },
        ];
      case 'C-Corp':
        return [
          {
            name: 'Certificate of Incorporation',
            url: `${baseUrl}/${docId}/certificate-of-incorporation.pdf`,
            type: 'pdf',
          },
          {
            name: 'Corporate Bylaws',
            url: `${baseUrl}/${docId}/bylaws.pdf`,
            type: 'pdf',
          },
        ];
      case 'S-Corp':
        return [
          {
            name: 'Certificate of Incorporation',
            url: `${baseUrl}/${docId}/certificate-of-incorporation.pdf`,
            type: 'pdf',
          },
          {
            name: 'Corporate Bylaws',
            url: `${baseUrl}/${docId}/bylaws.pdf`,
            type: 'pdf',
          },
          {
            name: 'S-Corp Election Form 2553',
            url: `${baseUrl}/${docId}/form-2553.pdf`,
            type: 'pdf',
          },
        ];
      default:
        throw new Error(`Unknown company type: ${type}`);
    }
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Mock Filing Agent
 */
export class MockFilingAgent {
  private filings: Map<string, FilingResponse> = new Map();

  async submitFiling(request: FilingRequest): Promise<FilingResponse> {
    // Simulate filing submission delay
    await this.delay(800);

    const filingId = this.generateFilingId();
    const confirmationNumber = this.generateConfirmationNumber();

    const response: FilingResponse = {
      filingId,
      status: 'submitted',
      confirmationNumber,
      filingDate: new Date().toISOString(),
      estimatedCompletionDate: this.getEstimatedCompletion(request.expedited),
    };

    this.filings.set(filingId, response);
    return response;
  }

  async getFilingStatus(filingId: string): Promise<FilingResponse> {
    const filing = this.filings.get(filingId);
    if (!filing) {
      throw new Error(`Filing not found: ${filingId}`);
    }
    return filing;
  }

  private generateFilingId(): string {
    return `filing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConfirmationNumber(): string {
    return `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private getEstimatedCompletion(expedited?: boolean): string {
    const days = expedited ? 2 : 7;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Test helper: simulate filing approval
  approveFiling(filingId: string): void {
    const filing = this.filings.get(filingId);
    if (filing) {
      filing.status = 'approved';
      this.filings.set(filingId, filing);
    }
  }

  // Test helper: simulate filing rejection
  rejectFiling(filingId: string): void {
    const filing = this.filings.get(filingId);
    if (filing) {
      filing.status = 'rejected';
      this.filings.set(filingId, filing);
    }
  }

  // Test helper: reset state
  reset(): void {
    this.filings.clear();
  }
}

// Export singleton instances for testing
export const mockNameCheckAgent = new MockNameCheckAgent();
export const mockDocumentFillerAgent = new MockDocumentFillerAgent();
export const mockFilingAgent = new MockFilingAgent();
