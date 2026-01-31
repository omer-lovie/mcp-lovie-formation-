/**
 * Validation utilities for user input
 */
import { ValidationResult } from '../types';
export declare class Validators {
    /**
     * Validates company name format
     */
    static companyName(name: string): ValidationResult;
    /**
     * Validates email format
     */
    static email(email: string): ValidationResult;
    /**
     * Validates US phone number
     */
    static phone(phone: string): ValidationResult;
    /**
     * Validates US ZIP code
     */
    static zipCode(zip: string): ValidationResult;
    /**
     * Validates SSN format
     */
    static ssn(ssn: string): ValidationResult;
    /**
     * Validates EIN format
     */
    static ein(ein: string): ValidationResult;
    /**
     * Validates ownership percentage
     */
    static ownershipPercentage(percentage: number): ValidationResult;
    /**
     * Validates total ownership adds up to 100%
     */
    static totalOwnership(percentages: number[]): ValidationResult;
    /**
     * Validates street address
     */
    static streetAddress(address: string): ValidationResult;
    /**
     * Validates city name
     */
    static city(city: string): ValidationResult;
    /**
     * Validates person name
     */
    static personName(name: string): ValidationResult;
    /**
     * Validates required field
     */
    static required(value: string, fieldName?: string): ValidationResult;
}
//# sourceMappingURL=validation.d.ts.map