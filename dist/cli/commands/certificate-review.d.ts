/**
 * Certificate Review Command Integration
 * Integrates certificate review workflow into the formation flow
 * Feature 002: Pre-Payment Certificate Review and Approval
 */
import { CompanyFormationData } from '../../types';
import { CertificateSessionData } from '../../services/certificate/types';
/**
 * Integration point for certificate review
 * Called AFTER review step and BEFORE payment step
 *
 * @param companyData - Complete company formation data
 * @returns Certificate session data if approved, null if cancelled/failed
 */
export declare function runCertificateReviewStep(companyData: CompanyFormationData): Promise<CertificateSessionData | null>;
//# sourceMappingURL=certificate-review.d.ts.map