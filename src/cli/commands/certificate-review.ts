/**
 * Certificate Review Command Integration
 * Integrates certificate review workflow into the formation flow
 * Feature 002: Pre-Payment Certificate Review and Approval
 */

import chalk from 'chalk';
import { reviewCertificateBeforePayment } from '../../workflows/certificate-review';
import { CompanyFormationData } from '../../types';
import { CertificateSessionData } from '../../services/certificate/types';

/**
 * Integration point for certificate review
 * Called AFTER review step and BEFORE payment step
 *
 * @param companyData - Complete company formation data
 * @returns Certificate session data if approved, null if cancelled/failed
 */
export async function runCertificateReviewStep(
  companyData: CompanyFormationData
): Promise<CertificateSessionData | null> {
  console.log();
  console.log(chalk.hex('#4A90E2')('   ╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║          ') + chalk.bold.white('CERTIFICATE PREVIEW') + chalk.hex('#4A90E2')('                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ╟────────────────────────────────────────────────────────╢'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.white('Before proceeding to payment, let\'s preview your') + chalk.hex('#4A90E2')('    ║'));
  console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.white('Certificate of Incorporation.') + chalk.hex('#4A90E2')('                       ║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.dim('This ensures all information is correct before') + chalk.hex('#4A90E2')('      ║'));
  console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.dim('making your payment.') + chalk.hex('#4A90E2')('                                ║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ╚════════════════════════════════════════════════════════╝'));
  console.log();

  try {
    // Run certificate review workflow
    const result = await reviewCertificateBeforePayment(companyData);

    if (result.approved && result.certificateData) {
      // Return certificate data directly (already in correct format)
      const certificateData: CertificateSessionData = {
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
      console.log(chalk.yellow('You can make changes and try again.'));
      return null;
    }

    if (result.error) {
      console.log(chalk.red(`Error: ${result.error}`));
      console.log(chalk.yellow('\nWould you like to proceed without certificate preview?'));
      return null;
    }

    return null;
  } catch (error) {
    console.log();
    console.log(chalk.red('Certificate preview encountered an error.'));
    console.log(chalk.yellow('You can proceed to payment, but we recommend reviewing your information carefully.'));
    console.log();

    return null;
  }
}
