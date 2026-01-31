"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STEP_DESCRIPTIONS = void 0;
exports.loadSession = loadSession;
exports.calculateProgress = calculateProgress;
exports.getCompletedSteps = getCompletedSteps;
exports.getRemainingSteps = getRemainingSteps;
const types_1 = require("../state/types");
const errors_1 = require("../errors");
// Step order for progress calculation (C-Corp)
const STEP_ORDER = [
    types_1.FormationStep.CREATED,
    types_1.FormationStep.BUSINESS_DESCRIBED,
    types_1.FormationStep.STATE_SELECTED,
    types_1.FormationStep.TYPE_SELECTED,
    types_1.FormationStep.ENDING_SELECTED,
    types_1.FormationStep.NAME_SET,
    types_1.FormationStep.NAME_CHECKED,
    types_1.FormationStep.COMPANY_ADDRESS_SET,
    types_1.FormationStep.AGENT_SET,
    types_1.FormationStep.SHARES_SET,
    types_1.FormationStep.SHAREHOLDERS_ADDED,
    types_1.FormationStep.AUTHORIZED_PARTY_SET,
    types_1.FormationStep.CERTIFICATE_GENERATED,
    types_1.FormationStep.CERTIFICATE_APPROVED,
    types_1.FormationStep.COMPLETED,
];
// Steps for LLC (no share structure)
const LLC_STEP_ORDER = [
    types_1.FormationStep.CREATED,
    types_1.FormationStep.BUSINESS_DESCRIBED,
    types_1.FormationStep.STATE_SELECTED,
    types_1.FormationStep.TYPE_SELECTED,
    types_1.FormationStep.ENDING_SELECTED,
    types_1.FormationStep.NAME_SET,
    types_1.FormationStep.NAME_CHECKED,
    types_1.FormationStep.COMPANY_ADDRESS_SET,
    types_1.FormationStep.AGENT_SET,
    types_1.FormationStep.SHAREHOLDERS_ADDED,
    types_1.FormationStep.AUTHORIZED_PARTY_SET,
    types_1.FormationStep.CERTIFICATE_GENERATED,
    types_1.FormationStep.CERTIFICATE_APPROVED,
    types_1.FormationStep.COMPLETED,
];
// Load and validate session
async function loadSession(sessionId, store) {
    const session = await store.get(sessionId);
    if (!session) {
        throw (0, errors_1.sessionNotFound)(sessionId);
    }
    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
        throw (0, errors_1.sessionExpired)(sessionId);
    }
    return session;
}
// Get step order based on company type
function getStepOrder(companyType) {
    return companyType === 'LLC' ? LLC_STEP_ORDER : STEP_ORDER;
}
// Calculate progress percentage
function calculateProgress(currentStep, companyType) {
    const steps = getStepOrder(companyType);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex === -1)
        return 0;
    return Math.round((currentIndex / (steps.length - 1)) * 100);
}
// Get completed steps
function getCompletedSteps(currentStep, companyType) {
    const steps = getStepOrder(companyType);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex === -1)
        return [];
    return steps.slice(0, currentIndex + 1);
}
// Get remaining steps
function getRemainingSteps(currentStep, companyType) {
    const steps = getStepOrder(companyType);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex === -1)
        return steps;
    return steps.slice(currentIndex + 1);
}
// Step descriptions for user-friendly messages
exports.STEP_DESCRIPTIONS = {
    [types_1.FormationStep.CREATED]: 'Session created',
    [types_1.FormationStep.BUSINESS_DESCRIBED]: 'Describe your business',
    [types_1.FormationStep.STATE_SELECTED]: 'Select formation state',
    [types_1.FormationStep.TYPE_SELECTED]: 'Select company type',
    [types_1.FormationStep.ENDING_SELECTED]: 'Select entity ending',
    [types_1.FormationStep.NAME_SET]: 'Set company name',
    [types_1.FormationStep.NAME_CHECKED]: 'Check name availability',
    [types_1.FormationStep.COMPANY_ADDRESS_SET]: 'Set company address',
    [types_1.FormationStep.AGENT_SET]: 'Set registered agent',
    [types_1.FormationStep.SHARES_SET]: 'Set share structure',
    [types_1.FormationStep.SHAREHOLDERS_ADDED]: 'Add shareholders',
    [types_1.FormationStep.AUTHORIZED_PARTY_SET]: 'Set authorized party',
    [types_1.FormationStep.CERTIFICATE_GENERATED]: 'Generate certificate',
    [types_1.FormationStep.CERTIFICATE_APPROVED]: 'Approve certificate',
    [types_1.FormationStep.COMPLETED]: 'Formation complete',
};
//# sourceMappingURL=session.js.map