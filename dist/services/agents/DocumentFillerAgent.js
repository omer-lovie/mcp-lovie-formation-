"use strict";
/**
 * Document Filler Agent Client (FR-022)
 * Handles PDF generation for incorporation documents
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentFillerAgent = void 0;
const BaseAgentClient_1 = require("./BaseAgentClient");
const types_1 = require("./types");
class DocumentFillerAgent extends BaseAgentClient_1.BaseAgentClient {
    constructor(config) {
        super('DocumentFillerAgent', config);
    }
    /**
     * Generate incorporation document (FR-022)
     * Completes within 30 seconds as per SC-006
     */
    async generateDocument(request, options) {
        // Use appropriate timeout for document generation (30s per SC-006, add buffer)
        const generateOptions = {
            ...options,
            timeout: options?.timeout || 45000, // 45s with buffer
        };
        return this.post('/api/v1/documents/generate', request, generateOptions);
    }
    /**
     * Generate all required documents for a company formation
     */
    async generateAllDocuments(sessionId, companyData, options) {
        // Determine required documents based on company type
        const documentTypes = this.getRequiredDocuments(companyData.companyType);
        const requests = documentTypes.map((docType) => ({
            sessionId,
            companyData,
            documentType: docType,
        }));
        return this.post('/api/v1/documents/generate-batch', { requests }, options);
    }
    /**
     * Get document generation progress
     */
    async getGenerationProgress(documentId, options) {
        return this.get(`/api/v1/documents/${documentId}/progress`, options);
    }
    /**
     * Get document generation status
     */
    async getDocumentStatus(documentId, options) {
        return this.get(`/api/v1/documents/${documentId}`, options);
    }
    /**
     * Download generated document
     */
    async downloadDocument(documentId, options) {
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
    async getDownloadUrl(documentId, expiresInSeconds = 3600, options) {
        const response = await this.post(`/api/v1/documents/${documentId}/download-url`, { expiresInSeconds }, options);
        return response.url;
    }
    /**
     * Cancel document generation
     */
    async cancelGeneration(documentId, options) {
        await this.delete(`/api/v1/documents/${documentId}`, options);
    }
    /**
     * Regenerate document (if there was an error or user requested changes)
     */
    async regenerateDocument(documentId, updatedData, options) {
        return this.post(`/api/v1/documents/${documentId}/regenerate`, { updatedData }, options);
    }
    /**
     * Preview document (get first page or thumbnail)
     */
    async previewDocument(sessionId, companyData, documentType, options) {
        return this.post('/api/v1/documents/preview', {
            sessionId,
            companyData,
            documentType,
        }, options);
    }
    /**
     * Validate document data before generation
     */
    async validateDocumentData(companyData, documentType, options) {
        return this.post('/api/v1/documents/validate', {
            companyData,
            documentType,
        }, {
            ...options,
            skipRetry: true, // No need to retry validation
        });
    }
    /**
     * Get list of all documents for a session
     */
    async getSessionDocuments(sessionId, options) {
        return this.get(`/api/v1/documents/session/${sessionId}`, options);
    }
    /**
     * Check if all required documents are ready
     */
    async areDocumentsReady(sessionId, options) {
        const documents = await this.getSessionDocuments(sessionId, options);
        return documents.every((doc) => doc.status === types_1.DocumentStatus.READY);
    }
    /**
     * Determine required documents based on company type
     */
    getRequiredDocuments(companyType) {
        switch (companyType) {
            case 'LLC':
                return [
                    types_1.DocumentType.ARTICLES,
                    types_1.DocumentType.OPERATING_AGREEMENT,
                ];
            case 'C-Corp':
                return [
                    types_1.DocumentType.ARTICLES,
                    types_1.DocumentType.BYLAWS,
                    types_1.DocumentType.STOCK_CERTIFICATES,
                ];
            case 'S-Corp':
                return [
                    types_1.DocumentType.ARTICLES,
                    types_1.DocumentType.BYLAWS,
                    types_1.DocumentType.STOCK_CERTIFICATES,
                ];
            default:
                return [];
        }
    }
}
exports.DocumentFillerAgent = DocumentFillerAgent;
//# sourceMappingURL=DocumentFillerAgent.js.map