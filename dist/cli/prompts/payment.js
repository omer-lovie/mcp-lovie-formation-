"use strict";
/**
 * Payment information prompts
 * FR-018: Secure payment collection
 * FR-019: Display costs before payment
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectPaymentInfo = collectPaymentInfo;
const inquirer_1 = __importDefault(require("inquirer"));
const formatter_1 = require("../utils/formatter");
/**
 * Get pricing based on state and company type
 */
function getPricing(state, companyType) {
    // Simplified pricing - in production, this would come from a database
    const stateFilingFees = {
        'Delaware': 90,
        'California': 70,
        'Texas': 300,
        'Florida': 125,
        'New York': 200,
        // Default for other states
        'default': 100
    };
    const stateFilingFee = stateFilingFees[state] || stateFilingFees['default'];
    const serviceFee = 99; // Lovie service fee
    return {
        stateFilingFee,
        serviceFee,
        total: stateFilingFee + serviceFee
    };
}
/**
 * Display pricing breakdown and collect payment confirmation
 */
async function collectPaymentInfo(state, companyType, currentStep, totalSteps) {
    (0, formatter_1.print)((0, formatter_1.formatSubheader)((0, formatter_1.formatProgress)(currentStep, totalSteps, 'Payment')));
    const pricing = getPricing(state, companyType);
    (0, formatter_1.print)('\n💳 Payment Summary\n');
    (0, formatter_1.print)((0, formatter_1.formatSummary)([
        { label: 'State Filing Fee', value: (0, formatter_1.formatCurrency)(pricing.stateFilingFee) },
        { label: 'Lovie Service Fee', value: (0, formatter_1.formatCurrency)(pricing.serviceFee) },
        { label: 'Total Amount', value: (0, formatter_1.formatCurrency)(pricing.total) }
    ]));
    (0, formatter_1.print)('\n');
    const { proceedToPayment } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'proceedToPayment',
            message: `Proceed to payment of ${(0, formatter_1.formatCurrency)(pricing.total)}?`,
            default: true
        }
    ]);
    if (!proceedToPayment) {
        return { confirmed: false };
    }
    // In production, this would integrate with Stripe or similar payment processor
    // For now, we'll simulate payment collection
    (0, formatter_1.print)('\n🔒 Payment processing will be handled securely via Stripe.');
    (0, formatter_1.print)('For this demo, we\'ll simulate payment confirmation.\n');
    const { confirmPayment } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'confirmPayment',
            message: 'Simulate successful payment?',
            default: true
        }
    ]);
    return { confirmed: confirmPayment };
}
//# sourceMappingURL=payment.js.map