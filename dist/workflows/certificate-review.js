"use strict";
/**
 * Certificate Review Workflow Orchestrator
 * Main orchestration function for pre-payment certificate review
 * Feature 002: Pre-Payment Certificate Review and Approval
 *
 * Workflow:
 * 1. Generate certificate via API
 * 2. Validate API response
 * 3. Start local web server
 * 4. Launch browser to display certificate
 * 5. Wait for user approval/cancellation
 * 6. Save certificate data to session if approved
 * 7. Clean up resources
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewCertificateBeforePayment = reviewCertificateBeforePayment;
exports.isCertificateExpired = isCertificateExpired;
exports.getCertificateMinutesRemaining = getCertificateMinutesRemaining;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../services/certificate/api");
const server_1 = require("../services/certificate/server");
const browser_1 = require("../utils/browser");
const WORKFLOW_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
/**
 * Review certificate before payment
 * Main orchestration function that coordinates the entire workflow
 *
 * @param companyData - Company formation data to generate certificate
 * @returns Promise<CertificateReviewResult> - Result of the review process
 */
async function reviewCertificateBeforePayment(companyData) {
    let spinner = null;
    const server = new server_1.CertificateReviewServer();
    const apiClient = new api_1.CertificateApiClient();
    try {
        // Step 1: Validate company data
        spinner = (0, ora_1.default)('Validating company information...').start();
        validateCompanyData(companyData);
        spinner.succeed('Company information validated');
        // Step 2: Check for default browser
        spinner = (0, ora_1.default)('Checking browser availability...').start();
        const hasBrowser = await (0, browser_1.hasDefaultBrowser)();
        if (!hasBrowser) {
            spinner.warn('No default browser detected');
            console.log(chalk_1.default.yellow('\n⚠️  Warning: No default browser detected.'));
            console.log(chalk_1.default.gray('You may need to manually open the certificate review page.\n'));
        }
        else {
            spinner.succeed('Browser available');
        }
        // Step 3: Generate certificate via API
        spinner = (0, ora_1.default)('Generating certificate of incorporation...').start();
        const certificateRequest = buildCertificateRequest(companyData);
        // Debug: Log the request payload
        console.log(chalk_1.default.dim('\n[DEBUG] Certificate request payload:'));
        console.log(chalk_1.default.dim(JSON.stringify(certificateRequest, null, 2)));
        console.log();
        const certificateResponse = await apiClient.generateCertificate(certificateRequest);
        spinner.succeed('Certificate generated successfully');
        // Debug: Log the download URL (with sensitive parts hidden)
        console.log(chalk_1.default.dim('\n[DEBUG] Download URL received:'));
        const urlPreview = certificateResponse.downloadUrl.substring(0, 80) + '...';
        console.log(chalk_1.default.dim(`  ${urlPreview}`));
        console.log(chalk_1.default.dim(`  Expires at: ${certificateResponse.expiresAt}`));
        console.log();
        // Step 4: Validate certificate response and check expiration
        spinner = (0, ora_1.default)('Validating certificate...').start();
        if (!certificateResponse.success) {
            throw new Error('Certificate generation failed');
        }
        const minutesRemaining = apiClient.getMinutesRemaining(certificateResponse.expiresAt);
        if (minutesRemaining <= 0) {
            throw new Error('Certificate URL expired immediately after generation');
        }
        spinner.succeed(`Certificate valid for ${minutesRemaining} minutes`);
        // Step 5: Start local web server
        spinner = (0, ora_1.default)('Starting certificate review server...').start();
        await server.start(certificateResponse.downloadUrl, companyData.companyName);
        const serverUrl = server.getUrl();
        spinner.succeed(`Server started at ${serverUrl}`);
        // Step 6: Launch browser
        spinner = (0, ora_1.default)('Opening certificate in your browser...').start();
        try {
            await (0, browser_1.openBrowser)(serverUrl);
            spinner.succeed('Browser opened');
        }
        catch (error) {
            spinner.warn('Could not open browser automatically');
            console.log(chalk_1.default.yellow('\n⚠️  Please manually open this URL in your browser:'));
            console.log(chalk_1.default.bold.cyan(`   ${serverUrl}\n`));
        }
        // Step 7: Display instructions
        console.log();
        console.log(chalk_1.default.hex('#4A90E2')('   ╔════════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║          ') + chalk_1.default.bold.white('REVIEW YOUR CERTIFICATE') + chalk_1.default.hex('#4A90E2')('                     ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ╟────────────────────────────────────────────────────────╢'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.white('Please review the certificate in your browser.') + chalk_1.default.hex('#4A90E2')('        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.dim('• Check that all information is correct') + chalk_1.default.hex('#4A90E2')('            ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.dim('• Click "Approve & Continue" to proceed') + chalk_1.default.hex('#4A90E2')('           ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.dim('• Click "Cancel" to make changes') + chalk_1.default.hex('#4A90E2')('                  ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║   ') + chalk_1.default.hex('#F39C12')(`⏱  Time remaining: ${minutesRemaining} minutes`.padEnd(48)) + chalk_1.default.hex('#4A90E2')('║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ║                                                        ║'));
        console.log(chalk_1.default.hex('#4A90E2')('   ╚════════════════════════════════════════════════════════╝'));
        console.log();
        // Step 8: Wait for user action
        spinner = (0, ora_1.default)('Waiting for your decision...').start();
        const userDecision = await waitForUserAction(server, WORKFLOW_TIMEOUT_MS);
        // Step 9: Handle user decision
        if (userDecision === 'approved') {
            spinner.succeed('Certificate approved!');
            // Save certificate data for session
            const certificateData = {
                certificateId: certificateResponse.certificateId,
                downloadUrl: certificateResponse.downloadUrl,
                s3Uri: certificateResponse.s3Uri,
                expiresAt: new Date(certificateResponse.expiresAt),
                approvedAt: new Date(),
                metadata: certificateResponse.metadata
            };
            console.log();
            console.log(chalk_1.default.hex('#2ECC71')('✓ ') + chalk_1.default.white('Certificate approved and saved to session'));
            console.log(chalk_1.default.dim(`   Certificate ID: ${certificateData.certificateId}`));
            console.log();
            return {
                approved: true,
                cancelled: false,
                certificateData
            };
        }
        else if (userDecision === 'cancelled') {
            spinner.info('Certificate review cancelled');
            console.log();
            console.log(chalk_1.default.hex('#F39C12')('⚠  ') + chalk_1.default.white('Certificate review cancelled'));
            console.log(chalk_1.default.dim('   You can make changes to your information'));
            console.log();
            return {
                approved: false,
                cancelled: true
            };
        }
        else {
            // Timeout
            spinner.fail('Certificate review timed out');
            console.log();
            console.log(chalk_1.default.hex('#E74C3C')('✗ ') + chalk_1.default.white('Certificate review timed out after 10 minutes'));
            console.log(chalk_1.default.dim('   Please try again'));
            console.log();
            return {
                approved: false,
                cancelled: false,
                error: 'Review session timed out'
            };
        }
    }
    catch (error) {
        if (spinner && spinner.isSpinning) {
            spinner.fail('Certificate review failed');
        }
        console.log();
        console.log(chalk_1.default.hex('#E74C3C')('   ╔════════════════════════════════════════════════════════╗'));
        console.log(chalk_1.default.hex('#E74C3C')('   ║                                                        ║'));
        console.log(chalk_1.default.hex('#E74C3C')('   ║     ') + chalk_1.default.bold.hex('#E74C3C')('✗  CERTIFICATE REVIEW FAILED') + chalk_1.default.white('                  ║'));
        console.log(chalk_1.default.hex('#E74C3C')('   ║                                                        ║'));
        console.log(chalk_1.default.hex('#E74C3C')('   ╚════════════════════════════════════════════════════════╝'));
        console.log();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.log(chalk_1.default.red(`Error: ${errorMessage}`));
        console.log();
        return {
            approved: false,
            cancelled: false,
            error: errorMessage
        };
    }
    finally {
        // Step 10: Clean up resources
        if (server.getIsRunning()) {
            await server.stop();
        }
    }
}
/**
 * Validate company data before generating certificate
 */
function validateCompanyData(companyData) {
    const errors = [];
    if (!companyData.companyName?.trim()) {
        errors.push('Company name is required');
    }
    if (!companyData.registeredAgent) {
        errors.push('Registered agent information is required');
    }
    else {
        const agent = companyData.registeredAgent;
        if (!agent.name?.trim())
            errors.push('Registered agent name is required');
        if (!agent.address) {
            errors.push('Registered agent address is required');
        }
        else {
            if (!agent.address.street1?.trim())
                errors.push('Registered agent street address is required');
            if (!agent.address.city?.trim())
                errors.push('Registered agent city is required');
            if (!agent.address.state?.trim())
                errors.push('Registered agent state is required');
            if (!agent.address.zipCode?.trim())
                errors.push('Registered agent zip code is required');
        }
    }
    if (!companyData.shareholders || companyData.shareholders.length === 0) {
        errors.push('At least one shareholder/member is required');
    }
    // Note: Incorporator is handled separately by the company and is not part of this API
    if (errors.length > 0) {
        throw new Error(`Invalid company data: ${errors.join(', ')}`);
    }
}
/**
 * Build certificate generation request from company data
 * Updated to support both C-Corp/S-Corp (Certificate of Incorporation) and LLC (Certificate of Formation)
 */
function buildCertificateRequest(companyData) {
    const agent = companyData.registeredAgent;
    const isLLC = companyData.companyType === 'LLC';
    // Map company type to API format
    const apiCompanyType = isLLC ? 'llc' : companyData.companyType === 'C-Corp' ? 'c-corp' : 's-corp';
    // Build base request
    const request = {
        companyType: apiCompanyType,
        companyName: companyData.companyName,
        registeredAgent: {
            name: agent.name,
            address: {
                street: agent.address.street1,
                city: agent.address.city,
                state: agent.address.state,
                zipCode: agent.address.zipCode,
                // County is required for C-Corp/S-Corp - default to Sussex for Delaware
                ...(isLLC ? {} : { county: 'Sussex' }),
            }
        },
    };
    // Add corporation-specific fields (C-Corp and S-Corp only)
    if (!isLLC) {
        request.authorizedShares = companyData.authorizedShares || 10000000;
        request.parValue = String(companyData.parValue || 0.00001);
        // Use first shareholder as incorporator
        const firstShareholder = companyData.shareholders?.[0];
        const incorporatorAddress = firstShareholder?.address || {
            street1: '8 The Green, Suite A',
            city: 'Dover',
            state: 'DE',
            zipCode: '19901',
        };
        request.incorporator = {
            name: firstShareholder ? `${firstShareholder.firstName} ${firstShareholder.lastName}` : 'Lovie Inc.',
            address: {
                street: incorporatorAddress.street1,
                city: incorporatorAddress.city,
                state: incorporatorAddress.state,
                zipCode: incorporatorAddress.zipCode,
            },
        };
    }
    return request;
}
/**
 * Wait for user action (approval, cancellation, or timeout)
 */
function waitForUserAction(server, timeoutMs) {
    return new Promise((resolve) => {
        let resolved = false;
        const resolveOnce = (value) => {
            if (!resolved) {
                resolved = true;
                resolve(value);
            }
        };
        // Listen for approval
        server.once(server_1.ServerEvent.APPROVED, () => {
            resolveOnce('approved');
        });
        // Listen for cancellation
        server.once(server_1.ServerEvent.CANCELLED, () => {
            resolveOnce('cancelled');
        });
        // Listen for timeout
        server.once(server_1.ServerEvent.TIMEOUT, () => {
            resolveOnce('timeout');
        });
        // Listen for errors
        server.once(server_1.ServerEvent.ERROR, () => {
            resolveOnce('timeout'); // Treat errors as timeout
        });
    });
}
/**
 * Check if certificate URL is expired and needs regeneration
 */
function isCertificateExpired(certificateData) {
    return new Date() >= certificateData.expiresAt;
}
/**
 * Get minutes remaining until certificate expires
 */
function getCertificateMinutesRemaining(certificateData) {
    const now = new Date();
    const remaining = certificateData.expiresAt.getTime() - now.getTime();
    if (remaining <= 0) {
        return 0;
    }
    return Math.floor(remaining / (60 * 1000));
}
//# sourceMappingURL=certificate-review.js.map