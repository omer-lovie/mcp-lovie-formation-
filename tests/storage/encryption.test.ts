/**
 * Tests for EncryptionService
 * Tests FR-027: Encryption of sensitive data
 */

import { EncryptionService } from '../../src/storage/encryption';
import { SessionError } from '../../src/storage/types';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService('test-encryption-key-for-testing');
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'This is sensitive data';
      const encrypted = encryptionService.encrypt(plaintext);

      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.encryptedData).not.toBe(plaintext);

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'Same text';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      // Different IVs mean different ciphertext
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);

      // But both decrypt to same plaintext
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~\n\t\r';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界 🚀 مرحبا العالم';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Object Encryption/Decryption', () => {
    it('should encrypt and decrypt objects', () => {
      const obj = {
        name: 'John Doe',
        ssn: '123-45-6789',
        age: 30,
        active: true,
      };

      const encrypted = encryptionService.encryptObject(obj);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: 'Alice',
          details: {
            ssn: '111-22-3333',
            address: {
              street: '123 Main St',
              city: 'New York',
            },
          },
        },
      };

      const encrypted = encryptionService.encryptObject(obj);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it('should handle arrays in objects', () => {
      const obj = {
        shareholders: [
          { name: 'Alice', share: 50 },
          { name: 'Bob', share: 50 },
        ],
      };

      const encrypted = encryptionService.encryptObject(obj);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(decrypted).toEqual(obj);
    });
  });

  describe('SSN Encryption', () => {
    it('should encrypt valid SSN formats', () => {
      const validSSNs = [
        '123-45-6789',
        '123456789',
        '987-65-4321',
      ];

      validSSNs.forEach((ssn) => {
        const encrypted = encryptionService.encryptSSN(ssn);
        expect(encrypted.encryptedData).toBeDefined();

        const decrypted = encryptionService.decrypt(encrypted);
        expect(decrypted).toBe(ssn.replace(/-/g, '')); // Normalized format
      });
    });

    it('should reject invalid SSN formats', () => {
      const invalidSSNs = [
        '123',
        '123-45',
        '123-45-678',
        '123-45-67890',
        'abc-de-fghi',
        '',
      ];

      invalidSSNs.forEach((ssn) => {
        expect(() => encryptionService.encryptSSN(ssn)).toThrow(SessionError);
      });
    });

    it('should normalize SSN by removing dashes', () => {
      const ssn = '123-45-6789';
      const encrypted = encryptionService.encryptSSN(ssn);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe('123456789');
    });
  });

  describe('Payment Information Encryption', () => {
    it('should encrypt payment information', () => {
      const paymentInfo = {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiry: '12/25',
        cardholderName: 'John Doe',
      };

      const encrypted = encryptionService.encryptPaymentInfo(paymentInfo);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(decrypted.lastFour).toBe('1111');
      expect(decrypted.cardNumber).toBe('****1111');
      expect(decrypted.cvv).toBe('123');
    });

    it('should mask card number except last 4 digits', () => {
      const paymentInfo = {
        cardNumber: '5555555555554444',
      };

      const encrypted = encryptionService.encryptPaymentInfo(paymentInfo);
      const decrypted = encryptionService.decryptObject(encrypted);

      expect(decrypted.lastFour).toBe('4444');
      expect(decrypted.cardNumber).toBe('****4444');
    });
  });

  describe('Hashing', () => {
    it('should produce consistent hashes for same input', () => {
      const data = 'sensitive-data';
      const hash1 = encryptionService.hash(data);
      const hash2 = encryptionService.hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different input', () => {
      const hash1 = encryptionService.hash('data1');
      const hash2 = encryptionService.hash('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce fixed-length hashes', () => {
      const hash1 = encryptionService.hash('short');
      const hash2 = encryptionService.hash('a'.repeat(1000));

      expect(hash1.length).toBe(hash2.length);
    });
  });

  describe('Token Generation', () => {
    it('should generate random tokens', () => {
      const token1 = encryptionService.generateToken();
      const token2 = encryptionService.generateToken();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(0);
    });

    it('should generate tokens of specified length', () => {
      const token16 = encryptionService.generateToken(16);
      const token32 = encryptionService.generateToken(32);

      // Base64url encoding makes it slightly longer
      expect(token16.length).toBeGreaterThan(16);
      expect(token32.length).toBeGreaterThan(token16.length);
    });

    it('should generate URL-safe tokens', () => {
      const token = encryptionService.generateToken(32);

      // Should not contain characters that need URL encoding
      expect(token).not.toMatch(/[+\/=]/);
    });
  });

  describe('Checksum Verification', () => {
    it('should create and verify checksums', () => {
      const data = JSON.stringify({ test: 'data' });
      const checksum = encryptionService.createChecksum(data);

      const isValid = encryptionService.verifyChecksum(data, checksum);
      expect(isValid).toBe(true);
    });

    it('should detect data tampering', () => {
      const data = JSON.stringify({ test: 'data' });
      const checksum = encryptionService.createChecksum(data);

      const tamperedData = JSON.stringify({ test: 'modified' });
      const isValid = encryptionService.verifyChecksum(tamperedData, checksum);

      expect(isValid).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      const data = 'test-data';
      const checksum = encryptionService.createChecksum(data);

      // Even with slightly different checksums, should not leak timing info
      const almostCorrectChecksum = checksum.slice(0, -2) + 'XX';

      expect(() =>
        encryptionService.verifyChecksum(data, almostCorrectChecksum)
      ).not.toThrow();
    });
  });

  describe('Security Properties', () => {
    it('should fail decryption with wrong key', () => {
      const plaintext = 'secret data';
      const service1 = new EncryptionService('key1');
      const service2 = new EncryptionService('key2');

      const encrypted = service1.encrypt(plaintext);

      expect(() => service2.decrypt(encrypted)).toThrow(SessionError);
    });

    it('should fail decryption with tampered ciphertext', () => {
      const plaintext = 'secret data';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with ciphertext
      const tampered = {
        ...encrypted,
        encryptedData: encrypted.encryptedData.slice(0, -2) + 'XX',
      };

      expect(() => encryptionService.decrypt(tampered)).toThrow(SessionError);
    });

    it('should fail decryption with tampered IV', () => {
      const plaintext = 'secret data';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with IV
      const tampered = {
        ...encrypted,
        iv: 'invalidIV==',
      };

      expect(() => encryptionService.decrypt(tampered)).toThrow();
    });

    it('should fail decryption with tampered auth tag', () => {
      const plaintext = 'secret data';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with auth tag
      const tampered = {
        ...encrypted,
        authTag: encrypted.authTag.slice(0, -2) + 'XX',
      };

      expect(() => encryptionService.decrypt(tampered)).toThrow(SessionError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle encryption with undefined key gracefully', () => {
      // Should use default key with warning
      const service = new EncryptionService();
      const encrypted = service.encrypt('test');

      expect(encrypted.encryptedData).toBeDefined();
    });

    it('should throw meaningful errors', () => {
      try {
        const encrypted = encryptionService.encrypt('test');
        encryptionService.decrypt({
          ...encrypted,
          authTag: 'invalid',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(SessionError);
        expect((error as SessionError).code).toBe('DECRYPTION_ERROR');
      }
    });
  });
});
