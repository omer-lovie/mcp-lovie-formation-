// Formation workflow step enumeration
export enum FormationStep {
  CREATED = 'created',
  STATE_SELECTED = 'state_selected',
  TYPE_SELECTED = 'type_selected',
  ENDING_SELECTED = 'ending_selected',
  NAME_SET = 'name_set',
  NAME_CHECKED = 'name_checked',
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
export type CompanyType = 'LLC' | 'C-Corp' | 'S-Corp';
export type USState = 'DE';

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  country?: string;
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

export interface Shareholder {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ownershipPercentage: number;
  address?: Address;
}

export interface AuthorizedParty {
  name: string;
  title: string;
}

export interface CompanyDetails {
  state?: USState;
  companyType?: CompanyType;
  entityEnding?: string;
  baseName?: string;
  fullName?: string;
}

export interface NameCheckResult {
  available: boolean;
  checkedAt: string;
  reason?: string;
  suggestions?: string[];
  responseTimeMs?: number;
}

export interface CertificateData {
  certificateId: string;
  generatedAt: string;
  previewUrl?: string;
  htmlContent?: string;
  approvedAt?: string;
}

export interface FormationSession {
  sessionId: string;
  status: SessionStatus;
  currentStep: FormationStep;
  companyDetails?: CompanyDetails;
  registeredAgent?: RegisteredAgent;
  shareStructure?: ShareStructure;
  shareholders: Shareholder[];
  authorizedParty?: AuthorizedParty;
  nameCheckResult?: NameCheckResult;
  certificateData?: CertificateData;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

// Default values
export const DEFAULT_REGISTERED_AGENT: RegisteredAgent = {
  isDefault: true,
  name: 'Harvard Business Services, Inc.',
  email: 'orders@delawareinc.com',
  phone: '1-800-345-2677',
  address: {
    street1: '16192 Coastal Highway',
    city: 'Lewes',
    state: 'DE',
    zipCode: '19958',
    county: 'Sussex',
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
  'S-Corp': ['Inc.', 'Incorporated', 'Corp.', 'Corporation', 'Company', 'Co.', 'Limited', 'Ltd.'],
};

// Company type descriptions
export const COMPANY_TYPE_DESCRIPTIONS: Record<CompanyType, string> = {
  'LLC': 'Limited Liability Company - Flexible structure with pass-through taxation',
  'C-Corp': 'C Corporation - Traditional corporate structure with double taxation',
  'S-Corp': 'S Corporation - Corporate structure with pass-through taxation (restrictions apply)',
};
