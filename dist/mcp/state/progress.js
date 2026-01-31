"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STEP_INFO = void 0;
exports.getStepInfo = getStepInfo;
exports.getStepsForCompanyType = getStepsForCompanyType;
exports.calculateDetailedProgress = calculateDetailedProgress;
exports.getStepGuidance = getStepGuidance;
const types_1 = require("./types");
// All formation steps with descriptions
exports.STEP_INFO = [
    {
        step: types_1.FormationStep.CREATED,
        name: 'Session Created',
        description: 'Formation session has been started',
        tool: 'formation_start',
    },
    {
        step: types_1.FormationStep.STATE_SELECTED,
        name: 'State Selected',
        description: 'Formation state has been chosen (Delaware)',
        tool: 'formation_set_state',
    },
    {
        step: types_1.FormationStep.TYPE_SELECTED,
        name: 'Company Type Selected',
        description: 'Company type has been chosen (LLC, C-Corp, or S-Corp)',
        tool: 'formation_set_company_type',
    },
    {
        step: types_1.FormationStep.ENDING_SELECTED,
        name: 'Entity Ending Selected',
        description: 'Legal suffix has been chosen (e.g., LLC, Inc.)',
        tool: 'formation_set_entity_ending',
    },
    {
        step: types_1.FormationStep.NAME_SET,
        name: 'Company Name Set',
        description: 'Company name has been entered',
        tool: 'formation_set_company_name',
    },
    {
        step: types_1.FormationStep.NAME_CHECKED,
        name: 'Name Availability Checked',
        description: 'Name has been verified with Delaware Secretary of State',
        tool: 'formation_check_name',
    },
    {
        step: types_1.FormationStep.AGENT_SET,
        name: 'Registered Agent Set',
        description: 'Registered agent information has been provided',
        tool: 'formation_set_registered_agent',
    },
    {
        step: types_1.FormationStep.SHARES_SET,
        name: 'Share Structure Set',
        description: 'Stock structure has been configured (corporations only)',
        tool: 'formation_set_share_structure',
    },
    {
        step: types_1.FormationStep.SHAREHOLDERS_ADDED,
        name: 'Shareholders/Members Added',
        description: 'Owners have been added with ownership percentages',
        tool: 'formation_add_shareholder',
    },
    {
        step: types_1.FormationStep.AUTHORIZED_PARTY_SET,
        name: 'Authorized Party Set',
        description: 'Person authorized to sign documents has been designated',
        tool: 'formation_set_authorized_party',
    },
    {
        step: types_1.FormationStep.CERTIFICATE_GENERATED,
        name: 'Certificate Generated',
        description: 'Certificate of formation has been generated for review',
        tool: 'formation_generate_certificate',
    },
    {
        step: types_1.FormationStep.CERTIFICATE_APPROVED,
        name: 'Certificate Approved',
        description: 'Certificate has been reviewed and approved',
        tool: 'formation_approve_certificate',
    },
    {
        step: types_1.FormationStep.COMPLETED,
        name: 'Formation Complete',
        description: 'Company formation is complete and ready for filing',
        tool: 'formation_get_status',
    },
];
// Get step info by step enum
function getStepInfo(step) {
    return exports.STEP_INFO.find(s => s.step === step);
}
// Get all steps for a company type (LLCs skip SHARES_SET)
function getStepsForCompanyType(companyType) {
    const allSteps = exports.STEP_INFO.map(s => s.step);
    if (companyType === 'LLC') {
        return allSteps.filter(s => s !== types_1.FormationStep.SHARES_SET);
    }
    return allSteps;
}
function calculateDetailedProgress(session) {
    const companyType = session.companyDetails?.companyType;
    const currentStep = session.currentStep;
    // Get appropriate steps for company type
    const relevantSteps = companyType === 'LLC'
        ? exports.STEP_INFO.filter(s => s.step !== types_1.FormationStep.SHARES_SET)
        : exports.STEP_INFO;
    const currentIndex = relevantSteps.findIndex(s => s.step === currentStep);
    const completedSteps = currentIndex >= 0
        ? relevantSteps.slice(0, currentIndex + 1)
        : [];
    const remainingSteps = currentIndex >= 0
        ? relevantSteps.slice(currentIndex + 1)
        : relevantSteps;
    const totalSteps = relevantSteps.length;
    const completedCount = completedSteps.length;
    const remainingCount = remainingSteps.length;
    const percentComplete = Math.round((completedCount / totalSteps) * 100);
    return {
        currentStep,
        currentStepInfo: getStepInfo(currentStep),
        completedSteps,
        remainingSteps,
        percentComplete,
        totalSteps,
        completedCount,
        remainingCount,
    };
}
// T060: Get guidance message for current step
function getStepGuidance(step, companyType) {
    const stepInfo = getStepInfo(step);
    if (!stepInfo) {
        return 'Continue with the formation process.';
    }
    const nextStepIndex = exports.STEP_INFO.findIndex(s => s.step === step) + 1;
    const nextStep = exports.STEP_INFO[nextStepIndex];
    if (!nextStep) {
        return 'Formation is complete! Proceed to payment to file with the Delaware Secretary of State.';
    }
    // Skip share structure for LLCs
    if (nextStep.step === types_1.FormationStep.SHARES_SET && companyType === 'LLC') {
        const afterShares = exports.STEP_INFO[nextStepIndex + 1];
        if (afterShares) {
            return `Next: ${afterShares.description}. Use ${afterShares.tool}.`;
        }
    }
    return `Next: ${nextStep.description}. Use ${nextStep.tool}.`;
}
//# sourceMappingURL=progress.js.map