/**
 * Document Filler Agent Client (FR-022)
 * Handles PDF generation for incorporation documents
 */
import { BaseAgentClient } from './BaseAgentClient';
import { AgentClientConfig, AgentClientOptions, DocumentGenerationRequest, DocumentGenerationResponse, DocumentGenerationProgress, DocumentType } from './types';
import { CompanyFormationData } from '../../storage/types';
export declare class DocumentFillerAgent extends BaseAgentClient {
    constructor(config: AgentClientConfig);
    /**
     * Generate incorporation document (FR-022)
     * Completes within 30 seconds as per SC-006
     */
    generateDocument(request: DocumentGenerationRequest, options?: AgentClientOptions): Promise<DocumentGenerationResponse>;
    /**
     * Generate all required documents for a company formation
     */
    generateAllDocuments(sessionId: string, companyData: CompanyFormationData, options?: AgentClientOptions): Promise<DocumentGenerationResponse[]>;
    /**
     * Get document generation progress
     */
    getGenerationProgress(documentId: string, options?: AgentClientOptions): Promise<DocumentGenerationProgress>;
    /**
     * Get document generation status
     */
    getDocumentStatus(documentId: string, options?: AgentClientOptions): Promise<DocumentGenerationResponse>;
    /**
     * Download generated document
     */
    downloadDocument(documentId: string, options?: AgentClientOptions): Promise<Buffer>;
    /**
     * Get download URL for document (pre-signed URL)
     */
    getDownloadUrl(documentId: string, expiresInSeconds?: number, options?: AgentClientOptions): Promise<string>;
    /**
     * Cancel document generation
     */
    cancelGeneration(documentId: string, options?: AgentClientOptions): Promise<void>;
    /**
     * Regenerate document (if there was an error or user requested changes)
     */
    regenerateDocument(documentId: string, updatedData?: Partial<CompanyFormationData>, options?: AgentClientOptions): Promise<DocumentGenerationResponse>;
    /**
     * Preview document (get first page or thumbnail)
     */
    previewDocument(sessionId: string, companyData: CompanyFormationData, documentType: DocumentType, options?: AgentClientOptions): Promise<{
        previewUrl: string;
    }>;
    /**
     * Validate document data before generation
     */
    validateDocumentData(companyData: CompanyFormationData, documentType: DocumentType, options?: AgentClientOptions): Promise<{
        valid: boolean;
        errors?: string[];
    }>;
    /**
     * Get list of all documents for a session
     */
    getSessionDocuments(sessionId: string, options?: AgentClientOptions): Promise<DocumentGenerationResponse[]>;
    /**
     * Check if all required documents are ready
     */
    areDocumentsReady(sessionId: string, options?: AgentClientOptions): Promise<boolean>;
    /**
     * Determine required documents based on company type
     */
    private getRequiredDocuments;
}
//# sourceMappingURL=DocumentFillerAgent.d.ts.map