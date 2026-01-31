"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formationApproveCertificateTool = exports.formationGenerateCertificateTool = void 0;
exports.registerCertificateTools = registerCertificateTools;
const index_1 = require("./index");
const types_1 = require("../state/types");
const session_1 = require("../middleware/session");
const errors_1 = require("../errors");
const api_1 = require("../../services/certificate/api");
// T039: formation_generate_certificate tool
exports.formationGenerateCertificateTool = {
    name: 'formation_generate_certificate',
    description: 'Generate the certificate document. For C-Corp/S-Corp generates Certificate of Incorporation, for LLC generates Certificate of Formation. Returns an S3 URL for the user to review the PDF document.',
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: { type: 'string', description: 'Session ID from formation_start' },
        },
        required: ['sessionId'],
    },
};
const handleFormationGenerateCertificate = async (args, store) => {
    const sessionId = args.sessionId;
    const session = await (0, session_1.loadSession)(sessionId, store);
    // Validate all required data is present
    if (!session.companyDetails?.fullName) {
        throw (0, errors_1.validationError)('companyName', 'Company name must be set before generating certificate');
    }
    if (!session.registeredAgent) {
        throw (0, errors_1.validationError)('registeredAgent', 'Registered agent must be set before generating certificate');
    }
    if (session.shareholders.length === 0) {
        throw (0, errors_1.validationError)('shareholders', 'At least one shareholder/member must be added before generating certificate');
    }
    if (!session.authorizedParty) {
        throw (0, errors_1.validationError)('authorizedParty', 'Authorized party must be set before generating certificate');
    }
    try {
        // Create certificate API client
        const certificateClient = new api_1.CertificateApiClient();
        // Determine company type for API
        const companyType = session.companyDetails?.companyType;
        const isLLC = companyType === 'LLC';
        const apiCompanyType = isLLC ? 'llc' : companyType === 'C-Corp' ? 'c-corp' : 's-corp';
        // Determine document type for display
        const documentType = isLLC ? 'Certificate of Formation' : 'Certificate of Incorporation';
        // Build the base request payload for the certificate API
        const request = {
            companyType: apiCompanyType,
            companyName: session.companyDetails.fullName,
            registeredAgent: {
                name: session.registeredAgent.name,
                address: {
                    street: session.registeredAgent.address.street1,
                    city: session.registeredAgent.address.city,
                    state: session.registeredAgent.address.state,
                    zipCode: session.registeredAgent.address.zipCode,
                    ...(isLLC ? {} : { county: session.registeredAgent.address.county || 'Sussex' }),
                },
            },
        };
        // Add corporation-specific fields (C-Corp and S-Corp)
        if (!isLLC) {
            request.authorizedShares = session.shareStructure?.authorizedShares || 10000000;
            request.parValue = String(session.shareStructure?.parValuePerShare || 0.00001);
            // Use the session incorporator or default incorporator (Sema Kurt Caskey)
            const incorporator = session.incorporator || types_1.DEFAULT_INCORPORATOR;
            request.incorporator = {
                name: incorporator.name,
                address: {
                    street: incorporator.address.street1,
                    city: incorporator.address.city,
                    state: incorporator.address.state,
                    zipCode: incorporator.address.zipCode,
                },
            };
        }
        // Call the certificate generation API
        const result = await certificateClient.generateCertificate(request);
        // T041: Calculate expiration time (use API response or default to 60 minutes)
        const expiresAt = result.expiresAt;
        const minutesRemaining = certificateClient.getMinutesRemaining(expiresAt);
        // Store certificate data in session
        const certificateData = {
            certificateId: result.certificateId,
            downloadUrl: result.downloadUrl,
            s3Uri: result.s3Uri,
            expiresAt,
            generatedAt: result.metadata.generatedAt,
            fileSize: result.metadata.fileSize,
            fileHash: result.metadata.fileHash,
        };
        session.certificateData = certificateData;
        session.currentStep = types_1.FormationStep.CERTIFICATE_GENERATED;
        session.status = types_1.SessionStatus.REVIEW;
        await store.save(session);
        return {
            success: true,
            certificateId: certificateData.certificateId,
            downloadUrl: certificateData.downloadUrl,
            documentType,
            companyType: apiCompanyType,
            expiresAt,
            minutesRemaining,
            // IMPORTANT: LLM MUST share this URL with the user
            certificateReviewRequired: {
                title: `📄 ${documentType} Generated`,
                action: `IMPORTANT: Please share the certificate URL below with the user so they can review their ${documentType} before approving.`,
                url: certificateData.downloadUrl,
                displayMessage: `Your ${documentType} is ready for review! Please click the link below to view your document:\n\n📄 **${documentType} URL:** ${certificateData.downloadUrl}\n\nThis link expires in ${minutesRemaining} minutes.`,
            },
            confirmationRequired: true,
            confirmationMessage: `Please review the ${documentType.toLowerCase()} at the URL above and confirm everything looks correct. Once confirmed, the formation will proceed.`,
            instructions: `IMPORTANT: Share the ${documentType.toLowerCase()} URL with the user. They must review the PDF document before approving. Once reviewed, use formation_approve_certificate to approve and complete the formation.`,
        };
    }
    catch (error) {
        // Re-throw MCPToolError as-is
        if (error instanceof errors_1.MCPToolError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new errors_1.MCPToolError({
            code: errors_1.ErrorCode.CERTIFICATE_GENERATION_FAILED,
            message: `Certificate generation failed: ${errorMessage}`,
            retryable: true,
            suggestion: 'Please verify all formation data is correct and try again.',
        });
    }
};
// T040: formation_approve_certificate tool
exports.formationApproveCertificateTool = {
    name: 'formation_approve_certificate',
    description: 'Approve the generated certificate after user review. This marks the formation as ready for payment.',
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: { type: 'string', description: 'Session ID from formation_start' },
        },
        required: ['sessionId'],
    },
};
const handleFormationApproveCertificate = async (args, store) => {
    const sessionId = args.sessionId;
    const session = await (0, session_1.loadSession)(sessionId, store);
    // Verify certificate exists
    if (!session.certificateData) {
        throw new errors_1.MCPToolError({
            code: errors_1.ErrorCode.CERTIFICATE_NOT_GENERATED,
            message: 'No certificate has been generated yet',
            retryable: false,
            suggestion: 'Generate a certificate first using formation_generate_certificate',
        });
    }
    // Check if URL expired
    const certificateData = session.certificateData;
    if (certificateData.expiresAt && new Date(certificateData.expiresAt) < new Date()) {
        throw new errors_1.MCPToolError({
            code: errors_1.ErrorCode.CERTIFICATE_URL_EXPIRED,
            message: 'Certificate URL has expired',
            retryable: true,
            suggestion: 'Generate a new certificate using formation_generate_certificate',
        });
    }
    // T042: Mark as approved and complete
    certificateData.approvedAt = new Date().toISOString();
    session.certificateData = certificateData;
    session.currentStep = types_1.FormationStep.CERTIFICATE_APPROVED;
    session.status = types_1.SessionStatus.COMPLETED;
    await store.save(session);
    // Build complete formation data for payment processing
    const formationData = {
        sessionId: session.sessionId,
        companyDetails: session.companyDetails,
        registeredAgent: session.registeredAgent,
        shareStructure: session.shareStructure,
        shareholders: session.shareholders,
        authorizedParty: session.authorizedParty,
        nameCheckResult: session.nameCheckResult,
        certificateData: session.certificateData,
        completedAt: certificateData.approvedAt,
    };
    // Determine company type and document type
    const companyType = session.companyDetails?.companyType;
    const isLLC = companyType === 'LLC';
    const documentType = isLLC ? 'Certificate of Formation' : 'Certificate of Incorporation';
    // Calculate par value for capital funding reminder (only for corporations)
    const shareStructure = session.shareStructure;
    const totalParValue = shareStructure ? shareStructure.authorizedShares * shareStructure.parValuePerShare : 0;
    const formattedParValue = totalParValue < 0.01 ? `$${totalParValue.toFixed(5)}` : `$${totalParValue.toFixed(2)}`;
    // Build next steps based on company type
    const nextSteps = isLLC
        ? [
            '1. Complete payment to file the formation documents',
            '2. Receive your Certificate of Formation from Delaware (typically 3-5 business days)',
            '3. Open your Lovie Bank Account',
            '4. Lovie will help you obtain your EIN (FREE)',
            '5. Lovie will keep you compliant with ongoing reminders',
        ]
        : [
            '1. Complete payment to file the formation documents',
            '2. Receive your Certificate of Incorporation from Delaware (typically 3-5 business days)',
            `3. Open your Lovie Bank Account and transfer ${formattedParValue} capital (required by law)`,
            '4. Lovie will help you obtain your EIN (FREE)',
            '5. Lovie will keep you compliant with ongoing reminders',
        ];
    // Build free services list based on company type
    const freeServices = [
        {
            service: 'EIN Application',
            description: 'Lovie will help you obtain your Employer Identification Number (EIN) from the IRS - completely FREE',
            status: 'Lovie handles this for you',
        },
        {
            service: 'Lovie Bank Account',
            description: 'Open your company bank account directly through Lovie - integrated with our financial platform',
            status: 'Available after formation',
        },
        {
            service: 'Compliance Monitoring',
            description: 'Lovie\'s in-house legal team will send you reminders for annual filings, franchise taxes, and other compliance requirements',
            status: 'Automatic - we\'ve got you covered',
        },
        {
            service: isLLC ? 'Operating Agreement' : 'Bylaws',
            description: 'All legally compliant documents are included with your formation',
            status: 'Included FREE',
        },
    ];
    // Add LLC to C-Corp upgrade offer for LLCs
    if (isLLC) {
        freeServices.push({
            service: 'FREE Upgrade to C-Corp',
            description: 'If you decide to raise money from investors in the future, Lovie will upgrade your LLC to a C-Corp for FREE!',
            status: 'Available anytime',
        });
    }
    return {
        success: true,
        status: 'completed',
        documentType,
        companyType,
        formationData,
        trackingInfo: {
            message: 'Lovie has started your formation process! You can track your formation status anytime.',
            methods: [
                'Use formation_get_status with your session ID to check status via MCP',
                'Visit the Lovie Dashboard to track progress',
            ],
            sessionId: session.sessionId,
            dashboardUrl: `https://lovie-web.vercel.app/dashboard/formations/${session.sessionId}`,
        },
        certificateUrl: session.certificateData?.downloadUrl || null,
        postFormationCompliance: {
            title: '🎉 Congratulations! Here\'s what Lovie will handle for you (FREE):',
            freeServices,
            capitalFundingReminder: !isLLC && shareStructure ? {
                title: '⚠️ Required: Fund Your Company Capital',
                amount: formattedParValue,
                instruction: `Remember to transfer ${formattedParValue} from your personal account to your company's Lovie Bank Account to comply with corporate law.`,
            } : null,
        },
        nextSteps,
        message: `🎉 Congratulations! Lovie has started your ${companyType} formation process. Track your status at: https://lovie-web.vercel.app/dashboard/formations/${session.sessionId}`,
    };
};
// T043: Register certificate tools
function registerCertificateTools() {
    (0, index_1.registerTool)(exports.formationGenerateCertificateTool, handleFormationGenerateCertificate);
    (0, index_1.registerTool)(exports.formationApproveCertificateTool, handleFormationApproveCertificate);
}
//# sourceMappingURL=certificate.js.map