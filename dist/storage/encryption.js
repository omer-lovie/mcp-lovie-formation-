"use strict";
/**
 * Encryption utilities for securing sensitive data
 * Implements FR-027: Encrypt sensitive data (SSN, payment info) at rest
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("./types");
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
class EncryptionService {
    constructor(password) {
        // Derive encryption key from password or environment variable
        const keySource = password || process.env.LOVIE_ENCRYPTION_KEY || this.generateDefaultKey();
        this.encryptionKey = this.deriveKey(keySource);
    }
    /**
     * Generate a default key for development (NOT for production use)
     */
    generateDefaultKey() {
        console.warn('⚠️  Using default encryption key. Set LOVIE_ENCRYPTION_KEY environment variable for production.');
        return 'lovie-cli-default-encryption-key-change-in-production';
    }
    /**
     * Derive a cryptographic key from a password using PBKDF2
     */
    deriveKey(password, salt) {
        const actualSalt = salt || crypto_1.default.randomBytes(SALT_LENGTH);
        return crypto_1.default.pbkdf2Sync(password, actualSalt, 100000, KEY_LENGTH, 'sha256');
    }
    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    encrypt(plaintext) {
        try {
            // Generate random initialization vector
            const iv = crypto_1.default.randomBytes(IV_LENGTH);
            // Create cipher
            const cipher = crypto_1.default.createCipheriv(ALGORITHM, this.encryptionKey, iv);
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
        }
        catch (error) {
            throw new types_1.SessionError('Encryption failed', 'ENCRYPTION_ERROR', error);
        }
    }
    /**
     * Decrypt data encrypted with encrypt()
     */
    decrypt(params) {
        try {
            // Convert base64 strings back to buffers
            const iv = Buffer.from(params.iv, 'base64');
            const authTag = Buffer.from(params.authTag, 'base64');
            // Create decipher
            const decipher = crypto_1.default.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
            decipher.setAuthTag(authTag);
            // Decrypt data
            let decrypted = decipher.update(params.encryptedData, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new types_1.SessionError('Decryption failed - data may be corrupted or key is incorrect', 'DECRYPTION_ERROR', error);
        }
    }
    /**
     * Encrypt an object (converts to JSON first)
     */
    encryptObject(obj) {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString);
    }
    /**
     * Decrypt and parse an encrypted object
     */
    decryptObject(params) {
        const jsonString = this.decrypt(params);
        return JSON.parse(jsonString);
    }
    /**
     * Hash sensitive data for comparison without storing plaintext
     */
    hash(data) {
        return crypto_1.default
            .createHash('sha256')
            .update(data)
            .digest('base64');
    }
    /**
     * Generate a secure random token
     */
    generateToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('base64url');
    }
    /**
     * Encrypt SSN with additional validation
     */
    encryptSSN(ssn) {
        // Validate SSN format (basic check)
        const ssnPattern = /^\d{3}-?\d{2}-?\d{4}$/;
        if (!ssnPattern.test(ssn)) {
            throw new types_1.SessionError('Invalid SSN format', 'INVALID_SSN_FORMAT');
        }
        // Normalize SSN (remove dashes)
        const normalizedSSN = ssn.replace(/-/g, '');
        return this.encrypt(normalizedSSN);
    }
    /**
     * Encrypt payment information
     */
    encryptPaymentInfo(paymentInfo) {
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
    createChecksum(data) {
        return crypto_1.default
            .createHmac('sha256', this.encryptionKey)
            .update(data)
            .digest('base64');
    }
    /**
     * Verify checksum
     */
    verifyChecksum(data, checksum) {
        const calculatedChecksum = this.createChecksum(data);
        return crypto_1.default.timingSafeEqual(Buffer.from(calculatedChecksum, 'base64'), Buffer.from(checksum, 'base64'));
    }
}
exports.EncryptionService = EncryptionService;
//# sourceMappingURL=encryption.js.map