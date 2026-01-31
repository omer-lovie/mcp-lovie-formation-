import { z, ZodSchema, ZodError } from 'zod';
import { CompanyType } from './state/types';
export declare const emailSchema: z.ZodString;
export declare const phoneSchema: z.ZodString;
export declare const zipCodeSchema: z.ZodString;
export declare const sessionIdSchema: z.ZodString;
export declare const companyNameSchema: z.ZodString;
export declare const stateSchema: z.ZodEnum<["DE"]>;
export declare const companyTypeSchema: z.ZodEnum<["LLC", "C-Corp", "S-Corp"]>;
export declare function validateEntityEnding(ending: string, companyType: CompanyType): boolean;
export declare const ownershipPercentageSchema: z.ZodNumber;
export declare const authorizedSharesSchema: z.ZodNumber;
export declare const parValueSchema: z.ZodNumber;
export declare const addressSchema: z.ZodObject<{
    street1: z.ZodString;
    street2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    zipCode: z.ZodString;
    county: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    state: string;
    city: string;
    zipCode: string;
    street1: string;
    county?: string | undefined;
    street2?: string | undefined;
    country?: string | undefined;
}, {
    state: string;
    city: string;
    zipCode: string;
    street1: string;
    county?: string | undefined;
    street2?: string | undefined;
    country?: string | undefined;
}>;
export declare const shareholderSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    ownershipPercentage: z.ZodNumber;
    address: z.ZodOptional<z.ZodObject<{
        street1: z.ZodString;
        street2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        county: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        state: string;
        city: string;
        zipCode: string;
        street1: string;
        county?: string | undefined;
        street2?: string | undefined;
        country?: string | undefined;
    }, {
        state: string;
        city: string;
        zipCode: string;
        street1: string;
        county?: string | undefined;
        street2?: string | undefined;
        country?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    ownershipPercentage: number;
    firstName: string;
    lastName: string;
    address?: {
        state: string;
        city: string;
        zipCode: string;
        street1: string;
        county?: string | undefined;
        street2?: string | undefined;
        country?: string | undefined;
    } | undefined;
    phone?: string | undefined;
}, {
    email: string;
    ownershipPercentage: number;
    firstName: string;
    lastName: string;
    address?: {
        state: string;
        city: string;
        zipCode: string;
        street1: string;
        county?: string | undefined;
        street2?: string | undefined;
        country?: string | undefined;
    } | undefined;
    phone?: string | undefined;
}>;
export declare const registeredAgentSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    address: z.ZodObject<{
        street1: z.ZodString;
        street2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        county: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        state: string;
        city: string;
        zipCode: string;
        street1: string;
        county?: string | undefined;
        street2?: string | undefined;
        country?: string | undefined;
    }, {
        state: string;
        city: string;
        zipCode: string;
        street1: string;
        county?: string | undefined;
        street2?: string | undefined;
        country?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    address: {
        state: string;
        city: string;
        zipCode: string;
        street1: string;
        county?: string | undefined;
        street2?: string | undefined;
        country?: string | undefined;
    };
    phone: string;
}, {
    name: string;
    email: string;
    address: {
        state: string;
        city: string;
        zipCode: string;
        street1: string;
        county?: string | undefined;
        street2?: string | undefined;
        country?: string | undefined;
    };
    phone: string;
}>;
export declare function validateInput<T>(schema: ZodSchema<T>, data: unknown): T;
export declare function safeValidateInput<T>(schema: ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    errors: ZodError;
};
export declare function validateTotalOwnership(percentages: number[]): {
    valid: boolean;
    total: number;
    message?: string;
};
//# sourceMappingURL=validation.d.ts.map