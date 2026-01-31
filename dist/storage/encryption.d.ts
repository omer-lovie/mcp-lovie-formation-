/**
 * Encryption utilities for securing sensitive data
 * Implements FR-027: Encrypt sensitive data (SSN, payment info) at rest
 */
import { EncryptionResult, DecryptionParams } from './types';
export declare class EncryptionService {
    private encryptionKey;
    constructor(password?: string);
    /**
     * Generate a default key for development (NOT for production use)
     */
    private generateDefaultKey;
    /**
     * Derive a cryptographic key from a password using PBKDF2
     */
    private deriveKey;
    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    encrypt(plaintext: string): EncryptionResult;
    /**
     * Decrypt data encrypted with encrypt()
     */
    decrypt(params: DecryptionParams): string;
    /**
     * Encrypt an object (converts to JSON first)
     */
    encryptObject<T>(obj: T): EncryptionResult;
    /**
     * Decrypt and parse an encrypted object
     */
    decryptObject<T>(params: DecryptionParams): T;
    /**
     * Hash sensitive data for comparison without storing plaintext
     */
    hash(data: string): string;
    /**
     * Generate a secure random token
     */
    generateToken(length?: number): string;
    /**
     * Encrypt SSN with additional validation
     */
    encryptSSN(ssn: string): EncryptionResult;
    /**
     * Encrypt payment information
     */
    encryptPaymentInfo(paymentInfo: Record<string, unknown>): EncryptionResult;
    /**
     * Create checksum for data integrity verification
     */
    createChecksum(data: string): string;
    /**
     * Verify checksum
     */
    verifyChecksum(data: string, checksum: string): boolean;
}
//# sourceMappingURL=encryption.d.ts.map