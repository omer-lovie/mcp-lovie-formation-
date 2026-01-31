/**
 * Input validation functions for CLI prompts
 * FR-008: Real-time input validation with helpful error messages
 */
import { ValidationResult } from '../types';
/**
 * Validates company name input
 */
export declare function validateCompanyName(name: string): ValidationResult;
/**
 * Validates email address
 */
export declare function validateEmail(email: string): ValidationResult;
/**
 * Validates phone number
 */
export declare function validatePhone(phone: string): ValidationResult;
/**
 * Validates address
 */
export declare function validateAddress(address: string): ValidationResult;
/**
 * Validates ownership percentage
 */
export declare function validateOwnershipPercentage(percentage: string): ValidationResult;
/**
 * Validates SSN format (optional, basic format check only)
 */
export declare function validateSSN(ssn: string): ValidationResult;
/**
 * Validates EIN format
 */
export declare function validateEIN(ein: string): ValidationResult;
/**
 * Validates person name
 */
export declare function validateName(name: string): ValidationResult;
//# sourceMappingURL=index.d.ts.map