"use strict";
/**
 * Validation utilities for user input
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validators = void 0;
class Validators {
    /**
     * Validates company name format
     */
    static companyName(name) {
        if (!name || name.trim().length === 0) {
            return { isValid: false, error: 'Company name is required' };
        }
        if (name.length < 3) {
            return { isValid: false, error: 'Company name must be at least 3 characters' };
        }
        if (name.length > 100) {
            return { isValid: false, error: 'Company name must be less than 100 characters' };
        }
        // Check for invalid characters
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(name)) {
            return { isValid: false, error: 'Company name contains invalid characters' };
        }
        return { isValid: true };
    }
    /**
     * Validates email format
     */
    static email(email) {
        if (!email || email.trim().length === 0) {
            return { isValid: false, error: 'Email is required' };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, error: 'Please enter a valid email address' };
        }
        return { isValid: true };
    }
    /**
     * Validates US phone number
     */
    static phone(phone) {
        if (!phone || phone.trim().length === 0) {
            return { isValid: false, error: 'Phone number is required' };
        }
        // Remove all non-digit characters for validation
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
            return { isValid: false, error: 'Phone number must be 10 digits (e.g., 555-123-4567)' };
        }
        return { isValid: true };
    }
    /**
     * Validates US ZIP code
     */
    static zipCode(zip) {
        if (!zip || zip.trim().length === 0) {
            return { isValid: false, error: 'ZIP code is required' };
        }
        // Support both 5-digit and ZIP+4 formats
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(zip)) {
            return { isValid: false, error: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)' };
        }
        return { isValid: true };
    }
    /**
     * Validates SSN format
     */
    static ssn(ssn) {
        if (!ssn || ssn.trim().length === 0) {
            return { isValid: false, error: 'SSN is required' };
        }
        // Remove all non-digit characters
        const digitsOnly = ssn.replace(/\D/g, '');
        if (digitsOnly.length !== 9) {
            return { isValid: false, error: 'SSN must be 9 digits (e.g., 123-45-6789)' };
        }
        // Check for invalid SSN patterns
        if (digitsOnly === '000000000' || digitsOnly === '111111111') {
            return { isValid: false, error: 'Please enter a valid SSN' };
        }
        return { isValid: true };
    }
    /**
     * Validates EIN format
     */
    static ein(ein) {
        if (!ein || ein.trim().length === 0) {
            return { isValid: false, error: 'EIN is required' };
        }
        // Remove all non-digit characters
        const digitsOnly = ein.replace(/\D/g, '');
        if (digitsOnly.length !== 9) {
            return { isValid: false, error: 'EIN must be 9 digits (e.g., 12-3456789)' };
        }
        return { isValid: true };
    }
    /**
     * Validates ownership percentage
     */
    static ownershipPercentage(percentage) {
        if (percentage < 0 || percentage > 100) {
            return { isValid: false, error: 'Ownership percentage must be between 0 and 100' };
        }
        if (percentage === 0) {
            return { isValid: false, error: 'Ownership percentage must be greater than 0' };
        }
        return { isValid: true };
    }
    /**
     * Validates total ownership adds up to 100%
     */
    static totalOwnership(percentages) {
        const total = percentages.reduce((sum, p) => sum + p, 0);
        if (Math.abs(total - 100) > 0.01) { // Allow for small floating point errors
            return {
                isValid: false,
                error: `Total ownership must equal 100% (currently ${total.toFixed(2)}%)`
            };
        }
        return { isValid: true };
    }
    /**
     * Validates street address
     */
    static streetAddress(address) {
        if (!address || address.trim().length === 0) {
            return { isValid: false, error: 'Street address is required' };
        }
        if (address.length < 5) {
            return { isValid: false, error: 'Please enter a complete street address' };
        }
        return { isValid: true };
    }
    /**
     * Validates city name
     */
    static city(city) {
        if (!city || city.trim().length === 0) {
            return { isValid: false, error: 'City is required' };
        }
        if (city.length < 2) {
            return { isValid: false, error: 'Please enter a valid city name' };
        }
        return { isValid: true };
    }
    /**
     * Validates person name
     */
    static personName(name) {
        if (!name || name.trim().length === 0) {
            return { isValid: false, error: 'Name is required' };
        }
        if (name.length < 2) {
            return { isValid: false, error: 'Please enter a valid name' };
        }
        // Must contain at least two words (first and last name)
        const words = name.trim().split(/\s+/);
        if (words.length < 2) {
            return { isValid: false, error: 'Please enter both first and last name' };
        }
        return { isValid: true };
    }
    /**
     * Validates required field
     */
    static required(value, fieldName = 'This field') {
        if (!value || value.trim().length === 0) {
            return { isValid: false, error: `${fieldName} is required` };
        }
        return { isValid: true };
    }
}
exports.Validators = Validators;
//# sourceMappingURL=validation.js.map