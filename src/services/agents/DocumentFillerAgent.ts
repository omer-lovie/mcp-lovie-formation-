/**
 * Document Filler Agent Client (FR-022)
 * Handles PDF generation for incorporation documents
 */

import { BaseAgentClient } from './BaseAgentClient';
import {
  AgentClientConfig,
  AgentClientOptions,
  DocumentGenerationRequest,
  DocumentGenerationResponse,
  DocumentGenerationProgress,
  DocumentType,
  DocumentStatus,
} from './types';
import { CompanyFormationData } from '../../storage/types';

export class DocumentFillerAgent extends BaseAgentClient {
  constructor(config: AgentClientConfig) {
    super('DocumentFillerAgent', config);
  }

  /**
   * Generate incorporation document (FR-022)
   * Completes within 30 seconds as per SC-006
   */
  async generateDocument(
    request: DocumentGenerationRequest,
    options?: AgentClientOptions
  ): Promise<DocumentGenerationResponse> {
    // Use appropriate timeout for document generation (30s per SC-006, add buffer)
    const generateOptions: AgentClientOptions = {
      ...options,
      timeout: options?.timeout || 45000, // 45s with buffer
    };

    return this.post<DocumentGenerationResponse>(
      '/api/v1/documents/generate',
      request,
      generateOptions
    );
  }

  /**
   * Generate all required documents for a company formation
   */
  async generateAllDocuments(
    sessionId: string,
    companyData: CompanyFormationData,
    options?: AgentClientOptions
  ): Promise<DocumentGenerationResponse[]> {
    // Determine required documents based on company type
    const documentTypes = this.getRequiredDocuments(companyData.companyType!);

    const requests = documentTypes.map((docType) => ({
      sessionId,
      companyData,
      documentType: docType,
    }));

    return this.post<DocumentGenerationResponse[]>(
      '/api/v1/documents/generate-batch',
      { requests },
      options
    );
  }

  /**
   * Get document generation progress
   */
  async getGenerationProgress(
    documentId: string,
    options?: AgentClientOptions
  ): Promise<DocumentGenerationProgress> {
    return this.get<DocumentGenerationProgress>(
      `/api/v1/documents/${documentId}/progress`,
      options
    );
  }

  /**
   * Get document generation status
   */
  async getDocumentStatus(
    documentId: string,
    options?: AgentClientOptions
  ): Promise<DocumentGenerationResponse> {
    return this.get<DocumentGenerationResponse>(
      `/api/v1/documents/${documentId}`,
      options
    );
  }

  /**
   * Download generated document
   */
  async downloadDocument(
    documentId: string,
    options?: AgentClientOptions
  ): Promise<Buffer> {
    const response = await this.client.get(`/api/v1/documents/${documentId}/download`, {
      responseType: 'arraybuffer',
      signal: options?.signal,
      timeout: options?.timeout,
    });

    return Buffer.from(response.data);
  }

  /**
   * Get download URL for document (pre-signed URL)
   */
  async getDownloadUrl(
    documentId: string,
    expiresInSeconds: number = 3600,
    options?: AgentClientOptions
  ): Promise<string> {
    const response = await this.post<{ url: string; expiresAt: string }>(
      `/api/v1/documents/${documentId}/download-url`,
      { expiresInSeconds },
      options
    );

    return response.url;
  }

  /**
   * Cancel document generation
   */
  async cancelGeneration(
    documentId: string,
    options?: AgentClientOptions
  ): Promise<void> {
    await this.delete<void>(`/api/v1/documents/${documentId}`, options);
  }

  /**
   * Regenerate document (if there was an error or user requested changes)
   */
  async regenerateDocument(
    documentId: string,
    updatedData?: Partial<CompanyFormationData>,
    options?: AgentClientOptions
  ): Promise<DocumentGenerationResponse> {
    return this.post<DocumentGenerationResponse>(
      `/api/v1/documents/${documentId}/regenerate`,
      { updatedData },
      options
    );
  }

  /**
   * Preview document (get first page or thumbnail)
   */
  async previewDocument(
    sessionId: string,
    companyData: CompanyFormationData,
    documentType: DocumentType,
    options?: AgentClientOptions
  ): Promise<{ previewUrl: string }> {
    return this.post<{ previewUrl: string }>(
      '/api/v1/documents/preview',
      {
        sessionId,
        companyData,
        documentType,
      },
      options
    );
  }

  /**
   * Validate document data before generation
   */
  async validateDocumentData(
    companyData: CompanyFormationData,
    documentType: DocumentType,
    options?: AgentClientOptions
  ): Promise<{ valid: boolean; errors?: string[] }> {
    return this.post<{ valid: boolean; errors?: string[] }>(
      '/api/v1/documents/validate',
      {
        companyData,
        documentType,
      },
      {
        ...options,
        skipRetry: true, // No need to retry validation
      }
    );
  }

  /**
   * Get list of all documents for a session
   */
  async getSessionDocuments(
    sessionId: string,
    options?: AgentClientOptions
  ): Promise<DocumentGenerationResponse[]> {
    return this.get<DocumentGenerationResponse[]>(
      `/api/v1/documents/session/${sessionId}`,
      options
    );
  }

  /**
   * Check if all required documents are ready
   */
  async areDocumentsReady(
    sessionId: string,
    options?: AgentClientOptions
  ): Promise<boolean> {
    const documents = await this.getSessionDocuments(sessionId, options);

    return documents.every(
      (doc) => doc.status === DocumentStatus.READY
    );
  }

  /**
   * Determine required documents based on company type
   */
  private getRequiredDocuments(
    companyType: 'LLC' | 'C-Corp' | 'S-Corp'
  ): DocumentType[] {
    switch (companyType) {
      case 'LLC':
        return [
          DocumentType.ARTICLES,
          DocumentType.OPERATING_AGREEMENT,
        ];
      case 'C-Corp':
        return [
          DocumentType.ARTICLES,
          DocumentType.BYLAWS,
          DocumentType.STOCK_CERTIFICATES,
        ];
      case 'S-Corp':
        return [
          DocumentType.ARTICLES,
          DocumentType.BYLAWS,
          DocumentType.STOCK_CERTIFICATES,
        ];
      default:
        return [];
    }
  }
}
