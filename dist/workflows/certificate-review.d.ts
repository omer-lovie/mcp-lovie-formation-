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
import { CertificateReviewResult, CertificateSessionData } from '../services/certificate/types';
import { CompanyFormationData } from '../types';
/**
 * Review certificate before payment
 * Main orchestration function that coordinates the entire workflow
 *
 * @param companyData - Company formation data to generate certificate
 * @returns Promise<CertificateReviewResult> - Result of the review process
 */
export declare function reviewCertificateBeforePayment(companyData: CompanyFormationData): Promise<CertificateReviewResult>;
/**
 * Check if certificate URL is expired and needs regeneration
 */
export declare function isCertificateExpired(certificateData: CertificateSessionData): boolean;
/**
 * Get minutes remaining until certificate expires
 */
export declare function getCertificateMinutesRemaining(certificateData: CertificateSessionData): number;
//# sourceMappingURL=certificate-review.d.ts.map