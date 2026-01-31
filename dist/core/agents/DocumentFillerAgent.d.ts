/**
 * Document Filler Agent - Generates incorporation documents
 * FR-022: CLI MUST communicate with Document Filler Agent to generate incorporation PDFs
 * SC-006: Document generation completes within 30 seconds of payment confirmation
 */
import { FormationData, DocumentResult, AgentResult, CompanyType } from '../types';
export interface DocumentRequest {
    formationData: FormationData;
    templates?: string[];
}
/**
 * Document Filler Agent for generating legal documents
 */
export declare class DocumentFillerAgent {
    private apiEndpoint;
    private timeout;
    constructor(apiEndpoint?: string);
    /**
     * Generate incorporation documents
     * @param request Formation data and optional template overrides
     * @returns Generated documents with URLs
     */
    generateDocuments(request: DocumentRequest): Promise<AgentResult<DocumentResult>>;
    /**
     * Perform actual document generation
     */
    private performDocumentGeneration;
    /**
     * Determine required documents based on company type and state
     */
    private getRequiredDocuments;
    /**
     * Validate formation data completeness for document generation
     */
    validateDataCompleteness(data: FormationData): {
        valid: boolean;
        missingFields: string[];
    };
    /**
     * Preview document content before generation
     * @param data Formation data
     * @returns Preview of document content
     */
    previewDocuments(data: FormationData): Promise<{
        documents: Array<{
            type: string;
            preview: string;
        }>;
    }>;
    /**
     * Generate text preview of document
     */
    private generateDocumentPreview;
    /**
     * Get document templates available for state and type
     */
    getAvailableTemplates(state: string, companyType: CompanyType): Promise<string[]>;
}
//# sourceMappingURL=DocumentFillerAgent.d.ts.map