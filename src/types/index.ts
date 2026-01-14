/**
 * Core type definitions for Lovie CLI
 */

export type CompanyType = 'LLC' | 'C-Corp' | 'S-Corp';

export type USState =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: USState;
  zipCode: string;
  country?: string;
}

export interface Shareholder {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  ownershipPercentage: number;
  ssn?: string;
  ein?: string;
}

export interface RegisteredAgent {
  name: string;
  address: Address;
  email: string;
  phone: string;
  isIndividual: boolean;
}

export interface CompanyFormationData {
  companyName: string;
  state: USState;
  companyType: CompanyType;
  shareholders: Shareholder[];
  registeredAgent?: RegisteredAgent;
  authorizedShares?: number;  // For C-Corp/S-Corp
  parValue?: number;  // Par value per share
}

export interface Company {
  name: string;
  state: USState;
  type: CompanyType;
  shareholders: Shareholder[];
  registeredAgent: RegisteredAgent;
  businessPurpose?: string;
}

export interface FormationSession {
  sessionId: string;
  currentStep: number;
  totalSteps: number;
  company: Partial<Company>;
  status: 'in-progress' | 'completed' | 'failed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDetails {
  filingFee: number;
  serviceFee: number;
  total: number;
  currency: string;
}

export interface FilingResult {
  filingNumber: string;
  filingDate: Date;
  confirmationNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  documents?: string[];
}

export interface NameCheckResult {
  available: boolean;
  suggestedNames?: string[];
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Export certificate storage types
export * from './certificate-storage';
