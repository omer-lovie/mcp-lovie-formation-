/**
 * Certificate service types for pre-payment certificate review workflow
 * Feature 002: Pre-Payment Certificate Review and Approval
 */

import { Address } from '../../types';

/**
 * Certificate API Request Payload
 * Updated: Incorporator is no longer required by the API
 * The company handles incorporator separately via incorporator statement
 */
export interface CertificateGenerationRequest {
  companyName: string;
  registeredAgent: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      county: string;
    };
  };
  /**
   * Number of shares authorized for the corporation
   * Must be a positive number greater than 0
   * For LLCs, use 0 as they don't have shares
   */
  sharesAuthorized: number;
  /**
   * Par value per share in dollars
   * Must be a non-negative number (can be 0)
   * For LLCs, use 0 as they don't have shares
   */
  parValue: number;
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
    generatedAt: string;
    fileSize: number;
    fileHash: string;
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
