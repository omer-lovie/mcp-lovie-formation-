"use strict";
/**
 * Document Filler Agent - Generates incorporation documents
 * FR-022: CLI MUST communicate with Document Filler Agent to generate incorporation PDFs
 * SC-006: Document generation completes within 30 seconds of payment confirmation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentFillerAgent = void 0;
const types_1 = require("../types");
/**
 * Document Filler Agent for generating legal documents
 */
class DocumentFillerAgent {
    constructor(apiEndpoint = process.env.DOCUMENT_FILLER_API_URL || '') {
        this.timeout = 30000; // 30 seconds per SC-006
        this.apiEndpoint = apiEndpoint;
    }
    /**
     * Generate incorporation documents
     * @param request Formation data and optional template overrides
     * @returns Generated documents with URLs
     */
    async generateDocuments(request) {
        const startTime = Date.now();
        try {
            const result = await this.performDocumentGeneration(request);
            const duration = Date.now() - startTime;
            return {
                success: true,
                data: result,
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Document generation failed',
                duration
            };
        }
    }
    /**
     * Perform actual document generation
     */
    async performDocumentGeneration(request) {
        // Simulate document generation delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { formationData } = request;
        const documents = this.getRequiredDocuments(formationData);
        // TODO: Replace with actual API call to document generation service
        // This is placeholder logic for development
        const generatedDocs = documents.map(docType => ({
            type: docType,
            filename: `${docType.replace(/\s+/g, '_')}_${formationData.sessionId}.pdf`,
            url: `https://docs.lovie.io/generated/${formationData.sessionId}/${docType}`,
            generatedAt: new Date()
        }));
        return {
            documents: generatedDocs,
            success: true
        };
    }
    /**
     * Determine required documents based on company type and state
     */
    getRequiredDocuments(data) {
        const { companyDetails } = data;
        if (!companyDetails) {
            throw new Error('Company details required for document generation');
        }
        const documents = [];
        switch (companyDetails.type) {
            case types_1.CompanyType.LLC:
                documents.push('Articles of Organization', 'Operating Agreement', 'Initial Members Resolution');
                break;
            case types_1.CompanyType.C_CORP:
            case types_1.CompanyType.S_CORP:
                documents.push('Certificate of Incorporation', 'Bylaws', 'Initial Board Resolution', 'Stock Certificates');
                if (companyDetails.type === types_1.CompanyType.S_CORP) {
                    documents.push('IRS Form 2553 (S-Corp Election)');
                }
                break;
        }
        // Add state-specific documents
        if (companyDetails.state === 'NY') {
            documents.push('Publication Affidavit');
        }
        return documents;
    }
    /**
     * Validate formation data completeness for document generation
     */
    validateDataCompleteness(data) {
        const missingFields = [];
        if (!data.companyDetails?.name) {
            missingFields.push('Company name');
        }
        if (!data.companyDetails?.state) {
            missingFields.push('State of incorporation');
        }
        if (!data.companyDetails?.type) {
            missingFields.push('Company type');
        }
        if (data.shareholders.length === 0) {
            missingFields.push('At least one shareholder/member');
        }
        if (!data.registeredAgent) {
            missingFields.push('Registered agent information');
        }
        // Validate shareholder ownership percentages sum to 100%
        const totalOwnership = data.shareholders.reduce((sum, sh) => sum + sh.ownershipPercentage, 0);
        if (Math.abs(totalOwnership - 100) > 0.01) {
            missingFields.push('Shareholder ownership must sum to 100%');
        }
        return {
            valid: missingFields.length === 0,
            missingFields
        };
    }
    /**
     * Preview document content before generation
     * @param data Formation data
     * @returns Preview of document content
     */
    async previewDocuments(data) {
        // Simulate preview generation
        await new Promise(resolve => setTimeout(resolve, 500));
        const documents = this.getRequiredDocuments(data);
        return {
            documents: documents.map(type => ({
                type,
                preview: this.generateDocumentPreview(type, data)
            }))
        };
    }
    /**
     * Generate text preview of document
     */
    generateDocumentPreview(type, data) {
        const { companyDetails, shareholders, registeredAgent } = data;
        let preview = `${type}\n\n`;
        preview += `Company Name: ${companyDetails?.name}\n`;
        preview += `State: ${companyDetails?.state}\n`;
        preview += `Type: ${companyDetails?.type}\n\n`;
        if (shareholders.length > 0) {
            preview += 'Shareholders/Members:\n';
            shareholders.forEach((sh, idx) => {
                preview += `${idx + 1}. ${sh.name} - ${sh.ownershipPercentage}%\n`;
            });
            preview += '\n';
        }
        if (registeredAgent) {
            preview += 'Registered Agent:\n';
            preview += `${registeredAgent.name}\n`;
            preview += `${registeredAgent.address.street}\n`;
            preview += `${registeredAgent.address.city}, ${registeredAgent.address.state} ${registeredAgent.address.zipCode}\n`;
        }
        return preview;
    }
    /**
     * Get document templates available for state and type
     */
    async getAvailableTemplates(state, companyType) {
        // TODO: Fetch from template service
        return this.getRequiredDocuments({
            companyDetails: { state: state, type: companyType, name: '' },
            shareholders: [],
            sessionId: '',
            currentStep: 'company_details',
            status: 'in_progress',
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
}
exports.DocumentFillerAgent = DocumentFillerAgent;
//# sourceMappingURL=DocumentFillerAgent.js.map