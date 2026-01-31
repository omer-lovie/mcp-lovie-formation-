"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registeredAgentSchema = exports.shareholderSchema = exports.addressSchema = exports.parValueSchema = exports.authorizedSharesSchema = exports.ownershipPercentageSchema = exports.companyTypeSchema = exports.stateSchema = exports.companyNameSchema = exports.sessionIdSchema = exports.zipCodeSchema = exports.phoneSchema = exports.emailSchema = void 0;
exports.validateEntityEnding = validateEntityEnding;
exports.validateInput = validateInput;
exports.safeValidateInput = safeValidateInput;
exports.validateTotalOwnership = validateTotalOwnership;
const zod_1 = require("zod");
const types_1 = require("./state/types");
// Email validation schema
exports.emailSchema = zod_1.z.string().email('Invalid email format');
// Phone validation schema (flexible format)
exports.phoneSchema = zod_1.z.string().min(10, 'Phone number must be at least 10 digits');
// ZIP code validation
exports.zipCodeSchema = zod_1.z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');
// Session ID validation
exports.sessionIdSchema = zod_1.z.string().uuid('Invalid session ID format');
// Company name validation
exports.companyNameSchema = zod_1.z.string()
    .min(3, 'Company name must be at least 3 characters')
    .max(200, 'Company name must be at most 200 characters');
// State validation
exports.stateSchema = zod_1.z.enum(['DE']);
// Company type validation
exports.companyTypeSchema = zod_1.z.enum(['LLC', 'C-Corp', 'S-Corp']);
// Entity ending validation (dynamic based on company type)
function validateEntityEnding(ending, companyType) {
    const validEndings = types_1.ENTITY_ENDINGS[companyType];
    return validEndings.includes(ending);
}
// Ownership percentage validation
exports.ownershipPercentageSchema = zod_1.z.number()
    .min(0.01, 'Ownership must be at least 0.01%')
    .max(100, 'Ownership cannot exceed 100%');
// Share structure validation
exports.authorizedSharesSchema = zod_1.z.number()
    .int('Authorized shares must be a whole number')
    .min(1, 'Must have at least 1 authorized share')
    .max(1000000000, 'Cannot exceed 1 billion shares');
exports.parValueSchema = zod_1.z.number()
    .min(0, 'Par value cannot be negative')
    .max(1000, 'Par value cannot exceed $1000');
// Address validation
exports.addressSchema = zod_1.z.object({
    street1: zod_1.z.string().min(1, 'Street address is required'),
    street2: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().length(2, 'State must be 2 characters'),
    zipCode: exports.zipCodeSchema,
    county: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
});
// Shareholder validation
exports.shareholderSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: exports.emailSchema,
    phone: exports.phoneSchema.optional(),
    ownershipPercentage: exports.ownershipPercentageSchema,
    address: exports.addressSchema.optional(),
});
// Registered agent validation
exports.registeredAgentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Agent name is required'),
    email: exports.emailSchema,
    phone: exports.phoneSchema,
    address: exports.addressSchema,
});
// Validation helper function
function validateInput(schema, data) {
    return schema.parse(data);
}
// Safe validation that returns result instead of throwing
function safeValidateInput(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
}
// Validate total ownership percentage for shareholders
function validateTotalOwnership(percentages) {
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
//# sourceMappingURL=validation.js.map