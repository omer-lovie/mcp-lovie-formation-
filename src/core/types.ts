/**
 * Core type definitions for company formation flow
 */

/**
 * Formation step identifiers
 */
export enum FormationStep {
  NAME = 'name',
  COMPANY_DETAILS = 'company_details',
  SHAREHOLDERS = 'shareholders',
  REGISTERED_AGENT = 'registered_agent',
  REVIEW = 'review',
  PAYMENT = 'payment',
  FILING = 'filing',
  CONFIRMATION = 'confirmation'
}

/**
 * Formation session status
 */
export enum FormationStatus {
  INITIATED = 'initiated',
  IN_PROGRESS = 'in_progress',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_COMPLETE = 'payment_complete',
  FILING_IN_PROGRESS = 'filing_in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Company types supported
 */
export enum CompanyType {
  LLC = 'llc',
  C_CORP = 'c_corp',
  S_CORP = 's_corp'
}

/**
 * US states (starting with Delaware for MVP)
 */
export enum State {
  DE = 'DE',
  CA = 'CA',
  TX = 'TX',
  NY = 'NY',
  FL = 'FL'
  // More states to be added
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
  ssn?: string; // Optional for entities
  ein?: string; // For entity shareholders
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
  isService: boolean; // True if using registered agent service
}

/**
 * Company details
 */
export interface CompanyDetails {
  name: string;
  state: State;
  type: CompanyType;
  purpose?: string; // Business purpose description
  effectiveDate?: Date; // When company becomes active
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
  reason?: string; // Why name is unavailable
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
