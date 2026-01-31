"use strict";
/**
 * Input validation functions for CLI prompts
 * FR-008: Real-time input validation with helpful error messages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCompanyName = validateCompanyName;
exports.validateEmail = validateEmail;
exports.validatePhone = validatePhone;
exports.validateAddress = validateAddress;
exports.validateOwnershipPercentage = validateOwnershipPercentage;
exports.validateSSN = validateSSN;
exports.validateEIN = validateEIN;
exports.validateName = validateName;
/**
 * Validates company name input
 */
function validateCompanyName(name) {
    if (!name || name.trim().length === 0) {
        return {
            valid: false,
            message: 'Company name cannot be empty'
        };
    }
    if (name.trim().length < 3) {
        return {
            valid: false,
            message: 'Company name must be at least 3 characters'
        };
    }
    if (name.trim().length > 100) {
        return {
            valid: false,
            message: 'Company name must be less than 100 characters'
        };
    }
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
        return {
            valid: false,
            message: 'Company name contains invalid characters. Please avoid: < > : " / \\ | ? *'
        };
    }
    return { valid: true };
}
/**
 * Validates email address
 */
function validateEmail(email) {
    if (!email || email.trim().length === 0) {
        return {
            valid: false,
            message: 'Email address is required'
        };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            valid: false,
            message: 'Please enter a valid email address (e.g., john@example.com)'
        };
    }
    return { valid: true };
}
/**
 * Validates phone number
 */
function validatePhone(phone) {
    if (!phone || phone.trim().length === 0) {
        return {
            valid: false,
            message: 'Phone number is required'
        };
    }
    // Remove common formatting characters
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    // Check for 10-digit US phone number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(cleanPhone)) {
        return {
            valid: false,
            message: 'Please enter a valid 10-digit US phone number (e.g., 555-123-4567)'
        };
    }
    return { valid: true };
}
/**
 * Validates address
 */
function validateAddress(address) {
    if (!address || address.trim().length === 0) {
        return {
            valid: false,
            message: 'Address is required'
        };
    }
    if (address.trim().length < 10) {
        return {
            valid: false,
            message: 'Please enter a complete address (e.g., 123 Main St, Suite 100, City, ST 12345)'
        };
    }
    return { valid: true };
}
/**
 * Validates ownership percentage
 */
function validateOwnershipPercentage(percentage) {
    const num = parseFloat(percentage);
    if (isNaN(num)) {
        return {
            valid: false,
            message: 'Please enter a valid number'
        };
    }
    if (num <= 0 || num > 100) {
        return {
            valid: false,
            message: 'Ownership percentage must be between 0.01 and 100'
        };
    }
    return { valid: true };
}
/**
 * Validates SSN format (optional, basic format check only)
 */
function validateSSN(ssn) {
    if (!ssn || ssn.trim().length === 0) {
        return { valid: true }; // SSN is optional in some contexts
    }
    // Remove hyphens
    const cleanSSN = ssn.replace(/\-/g, '');
    // Check for 9 digits
    const ssnRegex = /^\d{9}$/;
    if (!ssnRegex.test(cleanSSN)) {
        return {
            valid: false,
            message: 'Please enter a valid 9-digit SSN (e.g., 123-45-6789)'
        };
    }
    return { valid: true };
}
/**
 * Validates EIN format
 */
function validateEIN(ein) {
    if (!ein || ein.trim().length === 0) {
        return { valid: true }; // EIN is optional in some contexts
    }
    // Remove hyphens
    const cleanEIN = ein.replace(/\-/g, '');
    // Check for 9 digits
    const einRegex = /^\d{9}$/;
    if (!einRegex.test(cleanEIN)) {
        return {
            valid: false,
            message: 'Please enter a valid 9-digit EIN (e.g., 12-3456789)'
        };
    }
    return { valid: true };
}
/**
 * Validates person name
 */
function validateName(name) {
    if (!name || name.trim().length === 0) {
        return {
            valid: false,
            message: 'Name is required'
        };
    }
    if (name.trim().length < 2) {
        return {
            valid: false,
            message: 'Please enter a valid name'
        };
    }
    return { valid: true };
}
//# sourceMappingURL=index.js.map