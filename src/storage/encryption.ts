/**
 * Encryption utilities for securing sensitive data
 * Implements FR-027: Encrypt sensitive data (SSN, payment info) at rest
 */

import crypto from 'crypto';
import { EncryptionResult, DecryptionParams, SessionError } from './types';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;

export class EncryptionService {
  private encryptionKey: Buffer;

  constructor(password?: string) {
    // Derive encryption key from password or environment variable
    const keySource = password || process.env.LOVIE_ENCRYPTION_KEY || this.generateDefaultKey();
    this.encryptionKey = this.deriveKey(keySource);
  }

  /**
   * Generate a default key for development (NOT for production use)
   */
  private generateDefaultKey(): string {
    console.warn('⚠️  Using default encryption key. Set LOVIE_ENCRYPTION_KEY environment variable for production.');
    return 'lovie-cli-default-encryption-key-change-in-production';
  }

  /**
   * Derive a cryptographic key from a password using PBKDF2
   */
  private deriveKey(password: string, salt?: Buffer): Buffer {
    const actualSalt = salt || crypto.randomBytes(SALT_LENGTH);
    return crypto.pbkdf2Sync(password, actualSalt, 100000, KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(plaintext: string): EncryptionResult {
    try {
      // Generate random initialization vector
      const iv = crypto.randomBytes(IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
      };
    } catch (error) {
      throw new SessionError(
        'Encryption failed',
        'ENCRYPTION_ERROR',
        error
      );
    }
  }

  /**
   * Decrypt data encrypted with encrypt()
   */
  decrypt(params: DecryptionParams): string {
    try {
      // Convert base64 strings back to buffers
      const iv = Buffer.from(params.iv, 'base64');
      const authTag = Buffer.from(params.authTag, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(params.encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new SessionError(
        'Decryption failed - data may be corrupted or key is incorrect',
        'DECRYPTION_ERROR',
        error
      );
    }
  }

  /**
   * Encrypt an object (converts to JSON first)
   */
  encryptObject<T>(obj: T): EncryptionResult {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt and parse an encrypted object
   */
  decryptObject<T>(params: DecryptionParams): T {
    const jsonString = this.decrypt(params);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Hash sensitive data for comparison without storing plaintext
   */
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('base64');
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Encrypt SSN with additional validation
   */
  encryptSSN(ssn: string): EncryptionResult {
    // Validate SSN format (basic check)
    const ssnPattern = /^\d{3}-?\d{2}-?\d{4}$/;
    if (!ssnPattern.test(ssn)) {
      throw new SessionError(
        'Invalid SSN format',
        'INVALID_SSN_FORMAT'
      );
    }

    // Normalize SSN (remove dashes)
    const normalizedSSN = ssn.replace(/-/g, '');
    return this.encrypt(normalizedSSN);
  }

  /**
   * Encrypt payment information
   */
  encryptPaymentInfo(paymentInfo: Record<string, unknown>): EncryptionResult {
    // Remove or mask PAN (Primary Account Number) to last 4 digits only
    if (paymentInfo.cardNumber) {
      const cardNumber = String(paymentInfo.cardNumber);
      paymentInfo.lastFour = cardNumber.slice(-4);
      // Keep only last 4 for reference
      paymentInfo.cardNumber = `****${cardNumber.slice(-4)}`;
    }

    return this.encryptObject(paymentInfo);
  }

  /**
   * Create checksum for data integrity verification
   */
  createChecksum(data: string): string {
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('base64');
  }

  /**
   * Verify checksum
   */
  verifyChecksum(data: string, checksum: string): boolean {
    const calculatedChecksum = this.createChecksum(data);
    return crypto.timingSafeEqual(
      Buffer.from(calculatedChecksum, 'base64'),
      Buffer.from(checksum, 'base64')
    );
  }
}
