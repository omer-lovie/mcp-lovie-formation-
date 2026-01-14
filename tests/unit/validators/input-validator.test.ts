/**
 * Unit Tests - Input Validator
 * Tests validation logic for all user inputs
 */

describe('Input Validator', () => {
  describe('Company Name Validation', () => {
    it('should accept valid company names', () => {
      const validNames = [
        'Tech Startup LLC',
        "O'Reilly & Associates",
        'ABC-123 Corp',
        'Café Société LLC',
      ];

      validNames.forEach((name) => {
        const result = validateCompanyName(name);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject empty company names', () => {
      const result = validateCompanyName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Company name is required');
    });

    it('should reject names that are too long (>255 characters)', () => {
      const longName = 'A'.repeat(256);
      const result = validateCompanyName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Company name must be 255 characters or less');
    });

    it('should reject names with invalid characters', () => {
      const invalidNames = ['Company<script>', 'Test\x00Company', 'Bad\nName'];

      invalidNames.forEach((name) => {
        const result = validateCompanyName(name);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('SSN Validation', () => {
    it('should accept valid SSN formats', () => {
      const validSSNs = ['123-45-6789', '987-65-4321'];

      validSSNs.forEach((ssn) => {
        const result = validateSSN(ssn);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid SSN formats', () => {
      const invalidSSNs = [
        '123456789',
        '123-45-678',
        '12-345-6789',
        'abc-de-fghi',
        '000-00-0000',
        '666-45-6789',
      ];

      invalidSSNs.forEach((ssn) => {
        const result = validateSSN(ssn);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('EIN Validation', () => {
    it('should accept valid EIN formats', () => {
      const validEINs = ['12-3456789', '98-7654321'];

      validEINs.forEach((ein) => {
        const result = validateEIN(ein);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid EIN formats', () => {
      const invalidEINs = ['123456789', '12-345678', 'ab-cdefghi'];

      invalidEINs.forEach((ein) => {
        const result = validateEIN(ein);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Ownership Percentage Validation', () => {
    it('should accept valid ownership percentages', () => {
      const validPercentages = [0, 25, 50, 75, 100, 33.33];

      validPercentages.forEach((pct) => {
        const result = validateOwnershipPercentage(pct);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid ownership percentages', () => {
      const invalidPercentages = [-1, 101, -50, 150];

      invalidPercentages.forEach((pct) => {
        const result = validateOwnershipPercentage(pct);
        expect(result.isValid).toBe(false);
      });
    });

    it('should validate total ownership adds up to 100%', () => {
      const validTotals = [
        [50, 50],
        [33.33, 33.33, 33.34],
        [25, 25, 25, 25],
      ];

      validTotals.forEach((percentages) => {
        const result = validateTotalOwnership(percentages);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject totals that do not add up to 100%', () => {
      const invalidTotals = [
        [50, 40],
        [60, 50],
        [33, 33, 33],
      ];

      invalidTotals.forEach((percentages) => {
        const result = validateTotalOwnership(percentages);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Total ownership must equal 100%');
      });
    });
  });

  describe('Address Validation', () => {
    it('should accept valid US addresses', () => {
      const validAddresses = [
        '123 Main St, Wilmington, DE 19801',
        '456 Oak Avenue, Suite 100, Dover, DE 19901',
        'PO Box 789, Newark, DE 19711',
      ];

      validAddresses.forEach((address) => {
        const result = validateAddress(address);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject empty addresses', () => {
      const result = validateAddress('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Address is required');
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@domain',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
      });
    });
  });
});

// Mock validation functions (to be implemented in src/)
function validateCompanyName(name: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!name || name.trim() === '') {
    errors.push('Company name is required');
  }

  if (name.length > 255) {
    errors.push('Company name must be 255 characters or less');
  }

  // Check for invalid characters
  if (/[<>\x00\n\r\t]/.test(name)) {
    errors.push('Company name contains invalid characters');
  }

  return { isValid: errors.length === 0, errors };
}

function validateSSN(ssn: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ssnRegex = /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/;

  if (!ssnRegex.test(ssn)) {
    errors.push('Invalid SSN format. Must be XXX-XX-XXXX');
  }

  return { isValid: errors.length === 0, errors };
}

function validateEIN(ein: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const einRegex = /^\d{2}-\d{7}$/;

  if (!einRegex.test(ein)) {
    errors.push('Invalid EIN format. Must be XX-XXXXXXX');
  }

  return { isValid: errors.length === 0, errors };
}

function validateOwnershipPercentage(pct: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (pct < 0 || pct > 100) {
    errors.push('Ownership percentage must be between 0 and 100');
  }

  return { isValid: errors.length === 0, errors };
}

function validateTotalOwnership(percentages: number[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const total = percentages.reduce((sum, pct) => sum + pct, 0);

  // Allow small floating point tolerance
  if (Math.abs(total - 100) > 0.01) {
    errors.push('Total ownership must equal 100%');
  }

  return { isValid: errors.length === 0, errors };
}

function validateAddress(address: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!address || address.trim() === '') {
    errors.push('Address is required');
  }

  return { isValid: errors.length === 0, errors };
}

function validateEmail(email: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  return { isValid: errors.length === 0, errors };
}
