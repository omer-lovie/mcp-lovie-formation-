"use strict";
/**
 * Certificate Review Command Integration
 * Integrates certificate review workflow into the formation flow
 * Feature 002: Pre-Payment Certificate Review and Approval
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCertificateReviewStep = runCertificateReviewStep;
const chalk_1 = __importDefault(require("chalk"));
const certificate_review_1 = require("../../workflows/certificate-review");
/**
 * Integration point for certificate review
 * Called AFTER review step and BEFORE payment step
 *
 * @param companyData - Complete company formation data
 * @returns Certificate session data if approved, null if cancelled/failed
 */
async function runCertificateReviewStep(companyData) {
    console.log();
    console.log(chalk_1.default.hex('#4A90E2')('   ╔════════════════════════════════════════════════════════╗'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║          ') + chalk_1.default.bold.white('CERTIFICATE PREVIEW') + chalk_1.default.hex('#4A90E2')('                        ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ╟────────────────────────────────────────────────────────╢'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.white('Before proceeding to payment, let\'s preview your') + chalk_1.default.hex('#4A90E2')('    ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.white('Certificate of Incorporation.') + chalk_1.default.hex('#4A90E2')('                       ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.dim('This ensures all information is correct before') + chalk_1.default.hex('#4A90E2')('      ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.dim('making your payment.') + chalk_1.default.hex('#4A90E2')('                                ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk_1.default.hex('#4A90E2')('   ╚════════════════════════════════════════════════════════╝'));
    console.log();
    try {
        // Run certificate review workflow
        const result = await (0, certificate_review_1.reviewCertificateBeforePayment)(companyData);
        if (result.approved && result.certificateData) {
            // Return certificate data directly (already in correct format)
            const certificateData = {
                certificateId: result.certificateData.certificateId,
                downloadUrl: result.certificateData.downloadUrl,
                s3Uri: result.certificateData.s3Uri,
                expiresAt: result.certificateData.expiresAt,
                approvedAt: result.certificateData.approvedAt,
                metadata: result.certificateData.metadata
            };
            return certificateData;
        }
        if (result.cancelled) {
            console.log(chalk_1.default.yellow('You can make changes and try again.'));
            return null;
        }
        if (result.error) {
            console.log(chalk_1.default.red(`Error: ${result.error}`));
            console.log(chalk_1.default.yellow('\nWould you like to proceed without certificate preview?'));
            return null;
        }
        return null;
    }
    catch (error) {
        console.log();
        console.log(chalk_1.default.red('Certificate preview encountered an error.'));
        console.log(chalk_1.default.yellow('You can proceed to payment, but we recommend reviewing your information carefully.'));
        console.log();
        return null;
    }
}
//# sourceMappingURL=certificate-review.js.map