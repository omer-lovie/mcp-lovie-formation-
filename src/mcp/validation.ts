import { z, ZodSchema, ZodError } from 'zod';
import { ENTITY_ENDINGS, CompanyType } from './state/types';

// Email validation schema
export const emailSchema = z.string().email('Invalid email format');

// Phone validation schema (flexible format)
export const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits');

// ZIP code validation
export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');

// Session ID validation
export const sessionIdSchema = z.string().uuid('Invalid session ID format');

// Company name validation
export const companyNameSchema = z.string()
  .min(3, 'Company name must be at least 3 characters')
  .max(200, 'Company name must be at most 200 characters');

// State validation
export const stateSchema = z.enum(['DE']);

// Company type validation
export const companyTypeSchema = z.enum(['LLC', 'C-Corp', 'S-Corp']);

// Entity ending validation (dynamic based on company type)
export function validateEntityEnding(ending: string, companyType: CompanyType): boolean {
  const validEndings = ENTITY_ENDINGS[companyType];
  return validEndings.includes(ending);
}

// Ownership percentage validation
export const ownershipPercentageSchema = z.number()
  .min(0.01, 'Ownership must be at least 0.01%')
  .max(100, 'Ownership cannot exceed 100%');

// Share structure validation
export const authorizedSharesSchema = z.number()
  .int('Authorized shares must be a whole number')
  .min(1, 'Must have at least 1 authorized share')
  .max(1000000000, 'Cannot exceed 1 billion shares');

export const parValueSchema = z.number()
  .min(0, 'Par value cannot be negative')
  .max(1000, 'Par value cannot exceed $1000');

// Address validation
export const addressSchema = z.object({
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zipCode: zipCodeSchema,
  county: z.string().optional(),
  country: z.string().optional(),
});

// Shareholder validation
export const shareholderSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  ownershipPercentage: ownershipPercentageSchema,
  address: addressSchema.optional(),
});

// Registered agent validation
export const registeredAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
});

// Validation helper function
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Safe validation that returns result instead of throwing
export function safeValidateInput<T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Validate total ownership percentage for shareholders
export function validateTotalOwnership(percentages: number[]): { valid: boolean; total: number; message?: string } {
  const total = percentages.reduce((sum, p) => sum + p, 0);
  const rounded = Math.round(total * 100) / 100;

  if (rounded > 100) {
    return {
      valid: false,
      total: rounded,
      message: `Total ownership (${rounded}%) exceeds 100%`,
    };
  }

  return { valid: true, total: rounded };
}
