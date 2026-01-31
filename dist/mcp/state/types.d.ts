export declare enum FormationStep {
    CREATED = "created",
    BUSINESS_DESCRIBED = "business_described",
    STATE_SELECTED = "state_selected",
    TYPE_SELECTED = "type_selected",
    ENDING_SELECTED = "ending_selected",
    NAME_SET = "name_set",
    NAME_CHECKED = "name_checked",
    COMPANY_ADDRESS_SET = "company_address_set",
    AGENT_SET = "agent_set",
    SHARES_SET = "shares_set",
    SHAREHOLDERS_ADDED = "shareholders_added",
    AUTHORIZED_PARTY_SET = "authorized_party_set",
    CERTIFICATE_GENERATED = "certificate_generated",
    CERTIFICATE_APPROVED = "certificate_approved",
    COMPLETED = "completed"
}
export declare enum SessionStatus {
    CREATED = "created",
    IN_PROGRESS = "in_progress",
    REVIEW = "review",
    COMPLETED = "completed",
    ABANDONED = "abandoned",
    EXPIRED = "expired"
}
export type CompanyType = 'LLC' | 'C-Corp';
export type USState = 'DE' | 'WY';
export interface Address {
    street1: string;
    street2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
    country?: string;
}
export type AddressSource = 'own' | 'need_assistance';
export interface CompanyAddress {
    address?: Address;
    source: AddressSource;
    virtualPostMailInterested: boolean;
}
export interface RegisteredAgent {
    isDefault?: boolean;
    name: string;
    email: string;
    phone: string;
    address: Address;
}
export interface ShareStructure {
    isDefault?: boolean;
    authorizedShares: number;
    parValuePerShare: number;
}
export type ShareholderRole = 'member' | 'managing_member' | 'shareholder' | 'director' | 'officer';
export interface Shareholder {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    ownershipPercentage: number;
    address: Address;
    role?: ShareholderRole;
}
export interface AuthorizedParty {
    name: string;
    title: string;
}
export interface Incorporator {
    name: string;
    address: Address;
}
export declare const DEFAULT_INCORPORATOR: Incorporator;
export interface CompanyDetails {
    state?: USState;
    companyType?: CompanyType;
    entityEnding?: string;
    baseName?: string;
    fullName?: string;
    purpose?: string;
    effectiveDate?: string;
    companyAddress?: CompanyAddress;
    businessDescription?: string;
}
export interface NameCheckResult {
    available: boolean;
    checkedAt: string;
    reason?: string;
    suggestions?: string[];
    responseTimeMs?: number;
    error?: boolean;
}
export interface CertificateData {
    certificateId: string;
    generatedAt: string;
    previewUrl?: string;
    htmlContent?: string;
    approvedAt?: string;
}
export type SubmissionStatus = 'PENDING_REVIEW' | 'IN_REVIEW' | 'FILING' | 'COMPLETED' | 'ERROR';
export interface SubmissionResult {
    id: number;
    sessionId: string;
    userId: string;
    status: SubmissionStatus;
    companyName: string;
    entityType: string;
    stateOfFormation: string;
    confirmationNumber?: string | null;
    certificateUrl?: string | null;
    filingError?: string | null;
    submittedAt: string;
    filedAt?: string | null;
}
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export interface FormationSession {
    sessionId: string;
    userId?: string;
    status: SessionStatus;
    currentStep: FormationStep;
    companyDetails?: CompanyDetails;
    registeredAgent?: RegisteredAgent;
    shareStructure?: ShareStructure;
    shareholders: Shareholder[];
    authorizedParty?: AuthorizedParty;
    incorporator?: Incorporator;
    nameCheckResult?: NameCheckResult;
    certificateData?: CertificateData;
    submissionResult?: SubmissionResult;
    paymentStatus?: PaymentStatus;
    paymentCompletedAt?: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
}
export declare const DEFAULT_REGISTERED_AGENT: RegisteredAgent;
export declare const DEFAULT_SHARE_STRUCTURE: ShareStructure;
export declare const ENTITY_ENDINGS: Record<CompanyType, string[]>;
export declare const COMPANY_TYPE_DESCRIPTIONS: Record<CompanyType, string>;
export declare const STATE_COMPANY_TYPES: Record<USState, CompanyType[]>;
export declare const STATE_DESCRIPTIONS: Record<USState, string>;
//# sourceMappingURL=types.d.ts.map