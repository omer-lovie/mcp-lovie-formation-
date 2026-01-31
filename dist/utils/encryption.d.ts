/**
 * Encryption utilities for sensitive data
 */
/**
 * Encrypt sensitive data
 */
export declare function encrypt(text: string, password: string): string;
/**
 * Decrypt sensitive data
 */
export declare function decrypt(encryptedData: string, password: string): string;
/**
 * Hash data (one-way)
 */
export declare function hash(data: string): string;
/**
 * Generate secure random ID
 */
export declare function generateSecureId(): string;
//# sourceMappingURL=encryption.d.ts.map