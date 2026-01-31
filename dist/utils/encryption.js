"use strict";
/**
 * Encryption utilities for sensitive data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.hash = hash;
exports.generateSecureId = generateSecureId;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
/**
 * Derive encryption key from password
 */
function deriveKey(password, salt) {
    return crypto_1.default.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}
/**
 * Encrypt sensitive data
 */
function encrypt(text, password) {
    try {
        const salt = crypto_1.default.randomBytes(SALT_LENGTH);
        const key = deriveKey(password, salt);
        const iv = crypto_1.default.randomBytes(IV_LENGTH);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        // Combine salt + iv + tag + encrypted data
        const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
        return result.toString('base64');
    }
    catch (error) {
        throw new Error('Encryption failed');
    }
}
/**
 * Decrypt sensitive data
 */
function decrypt(encryptedData, password) {
    try {
        const buffer = Buffer.from(encryptedData, 'base64');
        const salt = buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const key = deriveKey(password, salt);
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        throw new Error('Decryption failed');
    }
}
/**
 * Hash data (one-way)
 */
function hash(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
/**
 * Generate secure random ID
 */
function generateSecureId() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
//# sourceMappingURL=encryption.js.map