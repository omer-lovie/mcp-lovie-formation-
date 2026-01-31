"use strict";
/**
 * Review and summary prompts
 * FR-012: Allow users to go back and edit
 * FR-016: Display summary before payment
 * FR-017: Allow editing any field
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displaySummary = displaySummary;
exports.reviewAndConfirm = reviewAndConfirm;
const inquirer_1 = __importDefault(require("inquirer"));
const formatter_1 = require("../utils/formatter");
/**
 * Display summary of all collected information
 */
function displaySummary(data) {
    (0, formatter_1.print)((0, formatter_1.formatHeader)('Review Your Information'));
    // Company details
    (0, formatter_1.print)((0, formatter_1.formatSubheader)('Company Details'));
    (0, formatter_1.print)((0, formatter_1.formatSummary)([
        { label: 'Company Name', value: data.companyName },
        { label: 'State', value: data.state },
        { label: 'Company Type', value: data.companyType }
    ]));
    // Shareholders/Members
    const entityType = data.companyType === 'LLC' ? 'Members' : 'Shareholders';
    (0, formatter_1.print)((0, formatter_1.formatSubheader)(`\n${entityType}`));
    data.shareholders.forEach((shareholder, index) => {
        (0, formatter_1.print)(`\n${formatter_1.colors.bold(`${entityType.slice(0, -1)} #${index + 1}:`)}`);
        (0, formatter_1.print)((0, formatter_1.formatSummary)([
            { label: '  Name', value: shareholder.name },
            { label: '  Address', value: shareholder.address },
            { label: '  Ownership', value: `${shareholder.ownershipPercentage}%` },
            {
                label: '  Tax ID',
                value: shareholder.ssn ? 'SSN (encrypted)' : shareholder.ein ? `EIN: ${shareholder.ein}` : 'Not provided'
            }
        ]));
    });
    // Registered Agent
    (0, formatter_1.print)((0, formatter_1.formatSubheader)('\nRegistered Agent'));
    (0, formatter_1.print)((0, formatter_1.formatSummary)([
        { label: 'Name', value: data.registeredAgent.name },
        { label: 'Address', value: data.registeredAgent.address },
        { label: 'Email', value: data.registeredAgent.contactInfo.email },
        { label: 'Phone', value: data.registeredAgent.contactInfo.phone }
    ]));
    (0, formatter_1.print)(''); // Empty line for spacing
}
/**
 * Ask user to review and confirm or edit
 */
async function reviewAndConfirm(data, currentStep, totalSteps) {
    (0, formatter_1.print)((0, formatter_1.formatSubheader)((0, formatter_1.formatProgress)(currentStep, totalSteps, 'Review & Confirm')));
    displaySummary(data);
    const { action } = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: '✓ Everything looks good, continue to payment', value: 'confirm' },
                { name: '✎ Edit company name', value: 'company-name' },
                { name: '✎ Edit state of incorporation', value: 'state' },
                { name: '✎ Edit company type', value: 'company-type' },
                { name: '✎ Edit shareholders/members', value: 'shareholders' },
                { name: '✎ Edit registered agent', value: 'registered-agent' },
                { name: '✗ Cancel and exit', value: 'cancel' }
            ],
            loop: false
        }
    ]);
    if (action === 'confirm') {
        return { confirmed: true };
    }
    if (action === 'cancel') {
        const { confirmCancel } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirmCancel',
                message: 'Are you sure you want to cancel? Your progress will be saved.',
                default: false
            }
        ]);
        if (confirmCancel) {
            return { confirmed: false, editField: 'none' };
        }
        // If they don't confirm cancellation, show the review again
        return reviewAndConfirm(data, currentStep, totalSteps);
    }
    return { confirmed: false, editField: action };
}
//# sourceMappingURL=review-summary.js.map