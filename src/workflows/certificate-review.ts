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

import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { CertificateApiClient } from '../services/certificate/api';
import { CertificateReviewServer, ServerEvent } from '../services/certificate/server';
import { openBrowser, hasDefaultBrowser } from '../utils/browser';
import {
  CertificateGenerationRequest,
  CertificateReviewResult,
  CertificateSessionData
} from '../services/certificate/types';
import { CompanyFormationData } from '../types';

const WORKFLOW_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Review certificate before payment
 * Main orchestration function that coordinates the entire workflow
 *
 * @param companyData - Company formation data to generate certificate
 * @returns Promise<CertificateReviewResult> - Result of the review process
 */
export async function reviewCertificateBeforePayment(
  companyData: CompanyFormationData
): Promise<CertificateReviewResult> {
  let spinner: Ora | null = null;
  const server = new CertificateReviewServer();
  const apiClient = new CertificateApiClient();

  try {
    // Step 1: Validate company data
    spinner = ora('Validating company information...').start();
    validateCompanyData(companyData);
    spinner.succeed('Company information validated');

    // Step 2: Check for default browser
    spinner = ora('Checking browser availability...').start();
    const hasBrowser = await hasDefaultBrowser();

    if (!hasBrowser) {
      spinner.warn('No default browser detected');
      console.log(chalk.yellow('\n⚠️  Warning: No default browser detected.'));
      console.log(chalk.gray('You may need to manually open the certificate review page.\n'));
    } else {
      spinner.succeed('Browser available');
    }

    // Step 3: Generate certificate via API
    spinner = ora('Generating certificate of incorporation...').start();

    const certificateRequest = buildCertificateRequest(companyData);

    // Debug: Log the request payload
    console.log(chalk.dim('\n[DEBUG] Certificate request payload:'));
    console.log(chalk.dim(JSON.stringify(certificateRequest, null, 2)));
    console.log();

    const certificateResponse = await apiClient.generateCertificate(certificateRequest);

    spinner.succeed('Certificate generated successfully');

    // Debug: Log the download URL (with sensitive parts hidden)
    console.log(chalk.dim('\n[DEBUG] Download URL received:'));
    const urlPreview = certificateResponse.downloadUrl.substring(0, 80) + '...';
    console.log(chalk.dim(`  ${urlPreview}`));
    console.log(chalk.dim(`  Expires at: ${certificateResponse.expiresAt}`));
    console.log();

    // Step 4: Validate certificate response and check expiration
    spinner = ora('Validating certificate...').start();

    if (!certificateResponse.success) {
      throw new Error('Certificate generation failed');
    }

    const minutesRemaining = apiClient.getMinutesRemaining(certificateResponse.expiresAt);

    if (minutesRemaining <= 0) {
      throw new Error('Certificate URL expired immediately after generation');
    }

    spinner.succeed(`Certificate valid for ${minutesRemaining} minutes`);

    // Step 5: Start local web server
    spinner = ora('Starting certificate review server...').start();

    await server.start(
      certificateResponse.downloadUrl,
      companyData.companyName
    );

    const serverUrl = server.getUrl();
    spinner.succeed(`Server started at ${serverUrl}`);

    // Step 6: Launch browser
    spinner = ora('Opening certificate in your browser...').start();

    try {
      await openBrowser(serverUrl);
      spinner.succeed('Browser opened');
    } catch (error) {
      spinner.warn('Could not open browser automatically');
      console.log(chalk.yellow('\n⚠️  Please manually open this URL in your browser:'));
      console.log(chalk.bold.cyan(`   ${serverUrl}\n`));
    }

    // Step 7: Display instructions
    console.log();
    console.log(chalk.hex('#4A90E2')('   ╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ║          ') + chalk.bold.white('REVIEW YOUR CERTIFICATE') + chalk.hex('#4A90E2')('                     ║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ╟────────────────────────────────────────────────────────╢'));
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.white('Please review the certificate in your browser.') + chalk.hex('#4A90E2')('        ║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.dim('• Check that all information is correct') + chalk.hex('#4A90E2')('            ║'));
    console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.dim('• Click "Approve & Continue" to proceed') + chalk.hex('#4A90E2')('           ║'));
    console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.dim('• Click "Cancel" to make changes') + chalk.hex('#4A90E2')('                  ║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.hex('#F39C12')(`⏱  Time remaining: ${minutesRemaining} minutes`.padEnd(48)) + chalk.hex('#4A90E2')('║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ╚════════════════════════════════════════════════════════╝'));
    console.log();

    // Step 8: Wait for user action
    spinner = ora('Waiting for your decision...').start();

    const userDecision = await waitForUserAction(server, WORKFLOW_TIMEOUT_MS);

    // Step 9: Handle user decision
    if (userDecision === 'approved') {
      spinner.succeed('Certificate approved!');

      // Save certificate data for session
      const certificateData: CertificateSessionData = {
        certificateId: certificateResponse.certificateId,
        downloadUrl: certificateResponse.downloadUrl,
        s3Uri: certificateResponse.s3Uri,
        expiresAt: new Date(certificateResponse.expiresAt),
        approvedAt: new Date(),
        metadata: certificateResponse.metadata
      };

      console.log();
      console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white('Certificate approved and saved to session'));
      console.log(chalk.dim(`   Certificate ID: ${certificateData.certificateId}`));
      console.log();

      return {
        approved: true,
        cancelled: false,
        certificateData
      };
    } else if (userDecision === 'cancelled') {
      spinner.info('Certificate review cancelled');

      console.log();
      console.log(chalk.hex('#F39C12')('⚠  ') + chalk.white('Certificate review cancelled'));
      console.log(chalk.dim('   You can make changes to your information'));
      console.log();

      return {
        approved: false,
        cancelled: true
      };
    } else {
      // Timeout
      spinner.fail('Certificate review timed out');

      console.log();
      console.log(chalk.hex('#E74C3C')('✗ ') + chalk.white('Certificate review timed out after 10 minutes'));
      console.log(chalk.dim('   Please try again'));
      console.log();

      return {
        approved: false,
        cancelled: false,
        error: 'Review session timed out'
      };
    }

  } catch (error) {
    if (spinner && spinner.isSpinning) {
      spinner.fail('Certificate review failed');
    }

    console.log();
    console.log(chalk.hex('#E74C3C')('   ╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
    console.log(chalk.hex('#E74C3C')('   ║     ') + chalk.bold.hex('#E74C3C')('✗  CERTIFICATE REVIEW FAILED') + chalk.white('                  ║'));
    console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
    console.log(chalk.hex('#E74C3C')('   ╚════════════════════════════════════════════════════════╝'));
    console.log();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log(chalk.red(`Error: ${errorMessage}`));
    console.log();

    return {
      approved: false,
      cancelled: false,
      error: errorMessage
    };
  } finally {
    // Step 10: Clean up resources
    if (server.getIsRunning()) {
      await server.stop();
    }
  }
}

/**
 * Validate company data before generating certificate
 */
function validateCompanyData(companyData: CompanyFormationData): void {
  const errors: string[] = [];

  if (!companyData.companyName?.trim()) {
    errors.push('Company name is required');
  }

  if (!companyData.registeredAgent) {
    errors.push('Registered agent information is required');
  } else {
    const agent = companyData.registeredAgent;
    if (!agent.name?.trim()) errors.push('Registered agent name is required');
    if (!agent.address) {
      errors.push('Registered agent address is required');
    } else {
      if (!agent.address.street1?.trim()) errors.push('Registered agent street address is required');
      if (!agent.address.city?.trim()) errors.push('Registered agent city is required');
      if (!agent.address.state?.trim()) errors.push('Registered agent state is required');
      if (!agent.address.zipCode?.trim()) errors.push('Registered agent zip code is required');
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
function buildCertificateRequest(
  companyData: CompanyFormationData
): CertificateGenerationRequest {
  const agent = companyData.registeredAgent!;
  const isLLC = companyData.companyType === 'LLC';

  // Map company type to API format
  const apiCompanyType = isLLC ? 'llc' : companyData.companyType === 'C-Corp' ? 'c-corp' : 's-corp';

  // Build base request
  const request: CertificateGenerationRequest = {
    companyType: apiCompanyType as 'c-corp' | 's-corp' | 'llc',
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
function waitForUserAction(
  server: CertificateReviewServer,
  timeoutMs: number
): Promise<'approved' | 'cancelled' | 'timeout'> {
  return new Promise((resolve) => {
    let resolved = false;

    const resolveOnce = (value: 'approved' | 'cancelled' | 'timeout') => {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    };

    // Listen for approval
    server.once(ServerEvent.APPROVED, () => {
      resolveOnce('approved');
    });

    // Listen for cancellation
    server.once(ServerEvent.CANCELLED, () => {
      resolveOnce('cancelled');
    });

    // Listen for timeout
    server.once(ServerEvent.TIMEOUT, () => {
      resolveOnce('timeout');
    });

    // Listen for errors
    server.once(ServerEvent.ERROR, () => {
      resolveOnce('timeout'); // Treat errors as timeout
    });
  });
}

/**
 * Check if certificate URL is expired and needs regeneration
 */
export function isCertificateExpired(certificateData: CertificateSessionData): boolean {
  return new Date() >= certificateData.expiresAt;
}

/**
 * Get minutes remaining until certificate expires
 */
export function getCertificateMinutesRemaining(certificateData: CertificateSessionData): number {
  const now = new Date();
  const remaining = certificateData.expiresAt.getTime() - now.getTime();

  if (remaining <= 0) {
    return 0;
  }

  return Math.floor(remaining / (60 * 1000));
}
