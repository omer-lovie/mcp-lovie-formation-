/**
 * Core type definitions for company formation flow
 */
/**
 * Formation step identifiers
 */
export declare enum FormationStep {
    NAME = "name",
    COMPANY_DETAILS = "company_details",
    SHAREHOLDERS = "shareholders",
    REGISTERED_AGENT = "registered_agent",
    REVIEW = "review",
    PAYMENT = "payment",
    FILING = "filing",
    CONFIRMATION = "confirmation"
}
/**
 * Formation session status
 */
export declare enum FormationStatus {
    INITIATED = "initiated",
    IN_PROGRESS = "in_progress",
    PAYMENT_PENDING = "payment_pending",
    PAYMENT_COMPLETE = "payment_complete",
    FILING_IN_PROGRESS = "filing_in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
/**
 * Company types supported
 */
export declare enum CompanyType {
    LLC = "llc",
    C_CORP = "c_corp",
    S_CORP = "s_corp"
}
/**
 * US states (starting with Delaware for MVP)
 */
export declare enum State {
    DE = "DE",
    CA = "CA",
    TX = "TX",
    NY = "NY",
    FL = "FL"
}
/**
 * Shareholder/Member information
 */
export interface Shareholder {
    id: string;
    name: string;
    email: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    ownershipPercentage: number;
    ssn?: string;
    ein?: string;
    isEntity: boolean;
}
/**
 * Registered agent information
 */
export interface RegisteredAgent {
    name: string;
    email?: string;
    phone?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    isService: boolean;
}
/**
 * Company details
 */
export interface CompanyDetails {
    name: string;
    state: State;
    type: CompanyType;
    purpose?: string;
    effectiveDate?: Date;
}
/**
 * Payment information
 */
export interface PaymentInfo {
    method: 'card' | 'ach';
    amount: number;
    breakdown: {
        stateFilingFee: number;
        serviceFee: number;
        expediteFee?: number;
    };
    transactionId?: string;
    processedAt?: Date;
}
/**
 * Filing result from state
 */
export interface FilingResult {
    success: boolean;
    filingNumber?: string;
    filingDate?: Date;
    confirmationUrl?: string;
    documentUrls?: string[];
    error?: string;
}
/**
 * Complete formation data
 */
export interface FormationData {
    sessionId: string;
    currentStep: FormationStep;
    status: FormationStatus;
    createdAt: Date;
    updatedAt: Date;
    companyDetails?: CompanyDetails;
    shareholders: Shareholder[];
    registeredAgent?: RegisteredAgent;
    payment?: PaymentInfo;
    filing?: FilingResult;
}
/**
 * Name check result
 */
export interface NameCheckResult {
    available: boolean;
    name: string;
    state: State;
    checkedAt: Date;
    alternatives?: string[];
    reason?: string;
}
/**
 * Agent operation result
 */
export interface AgentResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    duration?: number;
}
/**
 * Document generation result
 */
export interface DocumentResult {
    documents: Array<{
        type: string;
        filename: string;
        url: string;
        generatedAt: Date;
    }>;
    success: boolean;
    error?: string;
}
/**
 * State-specific requirements
 */
export interface StateRequirements {
    state: State;
    filingFee: number;
    processingTime: string;
    nameReservationRequired: boolean;
    publicationRequired: boolean;
    additionalRequirements?: string[];
}
//# sourceMappingURL=types.d.ts.map