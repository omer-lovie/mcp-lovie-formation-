/**
 * Certificate service types for pre-payment certificate review workflow
 * Feature 002: Pre-Payment Certificate Review and Approval
 * Updated: Now supports both C-Corp (Certificate of Incorporation) and LLC (Certificate of Formation)
 */

import { Address } from '../../types';

/**
 * Company types supported by the certificate API
 */
export type CertificateCompanyType = 'c-corp' | 's-corp' | 'llc';

/**
 * Base address structure for API requests
 */
export interface CertificateAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string; // Required for C-Corp/S-Corp, optional for LLC
}

/**
 * Registered agent for certificate request
 */
export interface CertificateRegisteredAgent {
  name: string;
  address: CertificateAddress;
}

/**
 * Incorporator information (required for C-Corp/S-Corp only)
 */
export interface CertificateIncorporator {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

/**
 * Certificate API Request Payload
 * Supports both C-Corp/S-Corp (Certificate of Incorporation) and LLC (Certificate of Formation)
 */
export interface CertificateGenerationRequest {
  /**
   * Type of company - determines which certificate to generate
   * "c-corp" or "s-corp" = Certificate of Incorporation
   * "llc" = Certificate of Formation
   */
  companyType: CertificateCompanyType;

  /**
   * Full legal company name including entity ending
   */
  companyName: string;

  /**
   * Registered agent information
   * Required for all company types
   */
  registeredAgent: CertificateRegisteredAgent;

  /**
   * Number of shares authorized for the corporation
   * Only required for C-Corp and S-Corp
   */
  authorizedShares?: number;

  /**
   * Par value per share as a string (e.g., "0.0001")
   * Only required for C-Corp and S-Corp
   */
  parValue?: string;

  /**
   * Incorporator information
   * Only required for C-Corp and S-Corp
   */
  incorporator?: CertificateIncorporator;
}

/**
 * Certificate API Response
 * From the certificate generation endpoint
 */
export interface CertificateGenerationResponse {
  success: boolean;
  certificateId: string;
  downloadUrl: string; // Presigned S3 URL with 1-hour expiration
  s3Uri: string;
  expiresAt: string; // ISO timestamp
  metadata: {
    companyName: string;
    documentType: string; // "c-corp-certificate-of-incorporation" or "llc-certificate-of-formation"
    generatedAt: string;
    fileSize: number;
    fileHash: string;
  };
  copyInstructions?: {
    awsCli: string;
    sdk: {
      region: string;
      bucket: string;
      key: string;
    };
  };
}

/**
 * Certificate data stored in session
 * After user approves the certificate
 */
export interface CertificateSessionData {
  certificateId: string;
  downloadUrl: string;
  s3Uri: string;
  expiresAt: Date;
  approvedAt: Date;
  metadata: {
    companyName: string;
    documentType: string;
    generatedAt: string;
    fileSize: number;
    fileHash: string;
  };
}

/**
 * Certificate review result
 * Returned by the workflow orchestrator
 */
export interface CertificateReviewResult {
  approved: boolean;
  cancelled: boolean;
  certificateData?: CertificateSessionData;
  error?: string;
}

/**
 * Certificate API client configuration
 */
export interface CertificateApiConfig {
  baseUrl: string;
  timeout?: number;
}
