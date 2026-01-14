/**
 * Certificate storage types for persistent certificate data management
 * Extends types from services/certificate/types for compatibility
 * All dates stored as ISO strings for JSON serialization
 */

/**
 * Extended certificate metadata for persistent storage
 * Contains additional information beyond the API response
 */
export interface StorageCertificateMetadata {
  /** Company name on the certificate */
  companyName: string;
  /** State where company was formed */
  state: string;
  /** Company type (LLC, C-Corp, S-Corp) */
  companyType: string;
  /** Date certificate was generated (ISO string for JSON serialization) */
  generatedAt: string;
  /** Filing number associated with the certificate */
  filingNumber?: string;
  /** Confirmation number from filing */
  confirmationNumber?: string;
  /** Certificate format (PDF, etc.) */
  format: 'PDF' | 'DOC' | 'DOCX';
  /** File size in bytes */
  fileSizeBytes?: number;
  /** File hash for integrity verification */
  fileHash?: string;
  /** Whether certificate has been downloaded */
  downloaded?: boolean;
  /** Download timestamp (ISO string) */
  downloadedAt?: string;
}

/**
 * Session certificate data stored persistently
 * This data persists across formation steps and after payment completion
 * All dates stored as ISO strings for JSON serialization
 */
export interface StoredCertificateData {
  /** Unique certificate identifier */
  certificateId: string;
  /** Public download URL for the certificate */
  downloadUrl: string;
  /** S3 URI for internal reference */
  s3Uri: string;
  /** Certificate metadata */
  metadata: StorageCertificateMetadata;
  /** Session ID this certificate belongs to */
  sessionId: string;
  /** When certificate data was stored (ISO string) */
  storedAt: string;
  /** Certificate expiry date for temporary URLs (ISO string) */
  expiresAt?: string;
  /** Whether this certificate is still valid/accessible */
  isValid: boolean;
}

/**
 * Certificate storage result
 */
export interface CertificateStorageResult {
  success: boolean;
  certificateId?: string;
  error?: string;
}

/**
 * Certificate retrieval result from storage
 */
export interface StorageCertificateRetrievalResult {
  success: boolean;
  data?: StoredCertificateData;
  error?: string;
}
