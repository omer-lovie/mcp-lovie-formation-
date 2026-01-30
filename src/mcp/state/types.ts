// Formation workflow step enumeration
export enum FormationStep {
  CREATED = 'created',
  BUSINESS_DESCRIBED = 'business_described',
  STATE_SELECTED = 'state_selected',
  TYPE_SELECTED = 'type_selected',
  ENDING_SELECTED = 'ending_selected',
  NAME_SET = 'name_set',
  NAME_CHECKED = 'name_checked',
  COMPANY_ADDRESS_SET = 'company_address_set',
  AGENT_SET = 'agent_set',
  SHARES_SET = 'shares_set',
  SHAREHOLDERS_ADDED = 'shareholders_added',
  AUTHORIZED_PARTY_SET = 'authorized_party_set',
  CERTIFICATE_GENERATED = 'certificate_generated',
  CERTIFICATE_APPROVED = 'certificate_approved',
  COMPLETED = 'completed',
}

// Session status enumeration
export enum SessionStatus {
  CREATED = 'created',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  EXPIRED = 'expired',
}

// Type definitions
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

// Company address with source tracking for Virtual Post Mail partnership
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

// Shareholder/member roles
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

// Incorporator information - used for Delaware formations
// The incorporator is the person who signs the Certificate of Incorporation
// and handles initial corporate formalities before transferring to the founders
export interface Incorporator {
  name: string;
  address: Address;
}

// Default incorporator - Lovie's internal legal team member
export const DEFAULT_INCORPORATOR: Incorporator = {
  name: 'Sema Kurt Caskey',
  address: {
    street1: '75 Omega Drive',
    street2: 'Suite 270',
    city: 'Newark',
    state: 'DE',
    zipCode: '19713',
    country: 'US',
  },
};

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

// Submission status from backend API
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

// Payment status
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

// Default values
export const DEFAULT_REGISTERED_AGENT: RegisteredAgent = {
  isDefault: true,
  name: 'Northwest Registered Agent',
  email: 'support@northwestregisteredagent.com',
  phone: '1-509-768-2249',
  address: {
    street1: '8 The Green, Suite A',
    city: 'Dover',
    state: 'DE',
    zipCode: '19901',
    county: 'Kent',
  },
};

export const DEFAULT_SHARE_STRUCTURE: ShareStructure = {
  isDefault: true,
  authorizedShares: 10000000,
  parValuePerShare: 0.00001,
};

// Entity endings by company type
export const ENTITY_ENDINGS: Record<CompanyType, string[]> = {
  'LLC': ['LLC', 'L.L.C.', 'Limited Liability Company'],
  'C-Corp': ['Inc.', 'Incorporated', 'Corp.', 'Corporation', 'Company', 'Co.', 'Limited', 'Ltd.'],
};

// Company type descriptions
export const COMPANY_TYPE_DESCRIPTIONS: Record<CompanyType, string> = {
  'LLC': 'Limited Liability Company - Flexible structure with pass-through taxation',
  'C-Corp': 'C Corporation - Traditional corporate structure, preferred by investors for fundraising',
};

// State-specific company type availability
export const STATE_COMPANY_TYPES: Record<USState, CompanyType[]> = {
  'DE': ['LLC', 'C-Corp'],
  'WY': ['LLC'],
};

// State descriptions
export const STATE_DESCRIPTIONS: Record<USState, string> = {
  'DE': 'Delaware - Premier business jurisdiction with specialized courts and well-established corporate law',
  'WY': 'Wyoming - Strong privacy protections, no state income tax, and low fees',
};
