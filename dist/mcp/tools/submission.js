"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formationCheckSubmissionStatusTool = exports.formationSubmitTool = void 0;
exports.registerSubmissionTools = registerSubmissionTools;
const index_1 = require("./index");
const types_1 = require("../state/types");
const session_1 = require("../middleware/session");
const errors_1 = require("../errors");
// Backend API URLs
const LOVIE_WEB_API_URL = 'https://lovie-web.vercel.app/api/v1';
const RAILWAY_API_URL = 'https://lovie-formation-agent-api-production.up.railway.app';
// formation_submit tool
exports.formationSubmitTool = {
    name: 'formation_submit',
    description: 'Submit the completed formation request to the backend for processing. This sends all collected data to the Lovie Formation API. Call this after all information has been collected and the certificate has been approved.',
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: { type: 'string', description: 'Session ID from formation_start' },
        },
        required: ['sessionId'],
    },
};
const handleFormationSubmit = async (args, store) => {
    const sessionId = args.sessionId;
    const session = await (0, session_1.loadSession)(sessionId, store);
    // Validate payment was completed
    if (session.paymentStatus !== 'completed') {
        throw (0, errors_1.validationError)('payment', 'Payment must be completed before submitting. Use formation_get_payment_link first.');
    }
    // Validate session has all required data
    if (!session.companyDetails?.fullName) {
        throw (0, errors_1.validationError)('companyDetails.name', 'Company name is required');
    }
    if (!session.companyDetails?.state) {
        throw (0, errors_1.validationError)('companyDetails.state', 'State is required');
    }
    if (!session.companyDetails?.companyType) {
        throw (0, errors_1.validationError)('companyDetails.entityType', 'Company type is required');
    }
    if (!session.companyDetails?.companyAddress) {
        throw (0, errors_1.validationError)('companyDetails.companyAddress', 'Company address is required');
    }
    if (!session.shareholders || session.shareholders.length === 0) {
        throw (0, errors_1.validationError)('shareholders', 'At least one shareholder/member is required');
    }
    if (!session.registeredAgent) {
        throw (0, errors_1.validationError)('registeredAgent', 'Registered agent is required');
    }
    if (!session.authorizedParty) {
        throw (0, errors_1.validationError)('authorizedParty', 'Authorized party is required');
    }
    // Validate ownership percentages sum to 100
    const totalOwnership = session.shareholders.reduce((sum, s) => sum + s.ownershipPercentage, 0);
    if (Math.abs(totalOwnership - 100) > 0.01) {
        throw (0, errors_1.validationError)('shareholders', `Shareholder ownership must sum to 100% (currently ${totalOwnership}%)`);
    }
    // Build the submission payload matching the API spec
    const payload = {
        sessionId: session.sessionId,
        userId: session.userId,
        companyDetails: {
            businessDescription: session.companyDetails.businessDescription,
            name: session.companyDetails.fullName,
            state: session.companyDetails.state,
            entityType: session.companyDetails.companyType,
            purpose: session.companyDetails.purpose || 'Any lawful purpose',
            effectiveDate: session.companyDetails.effectiveDate,
            companyAddress: session.companyDetails.companyAddress,
        },
        // Include incorporator for Delaware formations
        incorporator: session.incorporator ? {
            name: session.incorporator.name,
            address: session.incorporator.address,
        } : undefined,
        shareStructure: session.companyDetails.companyType === 'C-Corp' && session.shareStructure
            ? {
                authorizedShares: session.shareStructure.authorizedShares,
                parValuePerShare: session.shareStructure.parValuePerShare,
                isDefault: session.shareStructure.isDefault,
            }
            : undefined,
        shareholders: session.shareholders.map(s => ({
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phone: s.phone,
            ownershipPercentage: s.ownershipPercentage,
            role: s.role,
            address: s.address,
        })),
        registeredAgent: {
            name: session.registeredAgent.name,
            email: session.registeredAgent.email,
            phone: session.registeredAgent.phone,
            isDefault: session.registeredAgent.isDefault,
            address: session.registeredAgent.address,
        },
        authorizedParty: session.authorizedParty,
    };
    try {
        // Send to both APIs in parallel
        const [lovieWebResponse, railwayResponse] = await Promise.all([
            // Primary: Lovie Web API
            fetch(`${LOVIE_WEB_API_URL}/formations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }),
            // Secondary: Railway API (for backend processing)
            fetch(`${RAILWAY_API_URL}/api/submissions/formation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }).catch(err => {
                // Don't fail if Railway API is down, just log it
                console.error('Railway API submission failed:', err);
                return null;
            }),
        ]);
        const result = await lovieWebResponse.json();
        // Log Railway response status (non-blocking)
        if (railwayResponse) {
            const railwayResult = await railwayResponse.json().catch(() => null);
            console.log('Railway API response:', railwayResponse.status, railwayResult);
        }
        if (!lovieWebResponse.ok) {
            // Handle API errors
            if (lovieWebResponse.status === 409) {
                return {
                    success: false,
                    error: 'ALREADY_SUBMITTED',
                    message: result.message || 'Formation request already submitted',
                    sessionId,
                };
            }
            if (lovieWebResponse.status === 400 || lovieWebResponse.status === 422) {
                return {
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: result.message || 'Validation failed',
                    details: result.details,
                };
            }
            throw new Error(result.message || 'Failed to submit formation request');
        }
        if (!result.data) {
            throw new Error('Invalid response from server');
        }
        // Store submission result in session
        const submissionResult = {
            id: result.data.id,
            sessionId: result.data.sessionId,
            userId: result.data.userId,
            status: result.data.status,
            companyName: result.data.companyName,
            entityType: result.data.entityType,
            stateOfFormation: result.data.state,
            submittedAt: result.data.createdAt,
        };
        session.submissionResult = submissionResult;
        session.currentStep = types_1.FormationStep.COMPLETED;
        await store.save(session);
        return {
            success: true,
            message: 'Formation request submitted successfully! Our team will review and process your request.',
            submission: submissionResult,
            nextSteps: [
                'Your formation request is now in the queue for review',
                'You can check the status anytime using formation_check_submission_status',
                'Once filed, you will receive your confirmation number and certificate URL',
            ],
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            error: 'SUBMISSION_FAILED',
            message: `Failed to submit formation request: ${errorMessage}`,
            canRetry: true,
        };
    }
};
// formation_check_status tool (for checking submission status with backend)
exports.formationCheckSubmissionStatusTool = {
    name: 'formation_check_submission_status',
    description: 'Check the status of a submitted formation request with the backend. Returns the current status, confirmation number (if filed), and certificate URL (if available).',
    inputSchema: {
        type: 'object',
        properties: {
            sessionId: { type: 'string', description: 'Session ID from formation_start' },
        },
        required: ['sessionId'],
    },
};
const handleFormationCheckSubmissionStatus = async (args, store) => {
    const sessionId = args.sessionId;
    try {
        const response = await fetch(`${LOVIE_WEB_API_URL}/formations/${sessionId}/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 404) {
                return {
                    success: false,
                    error: 'NOT_FOUND',
                    message: 'Formation request not found. It may not have been submitted yet.',
                    sessionId,
                };
            }
            throw new Error(result.message || 'Failed to check status');
        }
        if (!result.data) {
            throw new Error('Invalid response from server');
        }
        const data = result.data;
        // Update session with latest status if we have it
        try {
            const session = await store.get(sessionId);
            if (session) {
                session.submissionResult = {
                    id: data.id,
                    sessionId: data.sessionId,
                    userId: session.userId || '',
                    status: data.status,
                    companyName: data.companyName,
                    entityType: data.entityType,
                    stateOfFormation: data.stateOfFormation,
                    confirmationNumber: data.confirmationNumber,
                    certificateUrl: data.certificateUrl,
                    filingError: data.filingError,
                    submittedAt: data.createdAt,
                    filedAt: data.filedAt,
                };
                await store.save(session);
            }
        }
        catch {
            // Session may not exist locally, that's okay
        }
        // Build user-friendly status message
        let statusMessage;
        switch (data.status) {
            case 'PENDING_REVIEW':
                statusMessage = 'Your formation request is in the queue waiting for review.';
                break;
            case 'IN_REVIEW':
                statusMessage = 'Your formation request is currently being reviewed by our team.';
                break;
            case 'FILING':
                statusMessage = 'Your formation is being filed with the state. This typically takes a few minutes.';
                break;
            case 'COMPLETED':
                statusMessage = 'Your company has been successfully formed!';
                break;
            case 'ERROR':
                statusMessage = `There was an issue with your formation: ${data.filingError || 'Unknown error'}`;
                break;
            default:
                statusMessage = `Current status: ${data.status}`;
        }
        return {
            success: true,
            status: data.status,
            statusMessage,
            companyName: data.companyName,
            entityType: data.entityType,
            state: data.stateOfFormation,
            confirmationNumber: data.confirmationNumber,
            certificateUrl: data.certificateUrl,
            filingError: data.filingError,
            submittedAt: data.createdAt,
            filedAt: data.filedAt,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            success: false,
            error: 'CHECK_STATUS_FAILED',
            message: `Failed to check status: ${errorMessage}`,
        };
    }
};
// Register tools
function registerSubmissionTools() {
    (0, index_1.registerTool)(exports.formationSubmitTool, handleFormationSubmit);
    (0, index_1.registerTool)(exports.formationCheckSubmissionStatusTool, handleFormationCheckSubmissionStatus);
}
//# sourceMappingURL=submission.js.map