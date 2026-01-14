/**
 * Mock data and test fixtures for Lovie CLI tests
 */

import {
  CompanyFormationData,
  SessionData,
  SessionStatus,
} from '../../src/storage/types';
import {
  NameCheckResponse,
  DocumentGenerationResponse,
  FilingResponse,
  DocumentType,
  DocumentStatus,
  FilingStatus,
  AgentStatus,
  SimilarNameInfo,
  FilingFees,
} from '../../src/services/agents/types';

// ============================================================================
// Company Data Fixtures
// ============================================================================

export const mockShareholder = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-123-4567',
  address: {
    street: '123 Main St',
    city: 'Wilmington',
    state: 'DE',
    zipCode: '19801',
  },
  ownershipPercentage: 100,
  ssn: '123-45-6789',
};

export const mockRegisteredAgent = {
  name: 'Delaware Registered Agent Services',
  address: {
    street: '456 Agent St',
    city: 'Wilmington',
    state: 'DE',
    zipCode: '19801',
  },
  email: 'agent@example.com',
  phone: '555-987-6543',
};

export const mockCompanyFormationData: CompanyFormationData = {
  companyName: 'Test Company LLC',
  companyType: 'LLC',
  state: 'DE',
  shareholders: [mockShareholder],
  registeredAgent: mockRegisteredAgent,
};

export const mockCompanyFormationDataCCorp: CompanyFormationData = {
  companyName: 'Test Corporation Inc',
  companyType: 'C-Corp',
  state: 'CA',
  shareholders: [
    { ...mockShareholder, ownershipPercentage: 60 },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-234-5678',
      address: {
        street: '789 Oak Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
      },
      ownershipPercentage: 40,
      ssn: '987-65-4321',
    },
  ],
  registeredAgent: mockRegisteredAgent,
};

export const mockPaymentInfo = {
  cardNumber: '4111111111111111',
  cardholderName: 'John Doe',
  expiryMonth: '12',
  expiryYear: '2025',
  cvv: '123',
  billingAddress: {
    street: '123 Main St',
    city: 'Wilmington',
    state: 'DE',
    zipCode: '19801',
  },
};

// ============================================================================
// Session Data Fixtures
// ============================================================================

export const mockSessionData: SessionData = {
  sessionId: 'session-test-12345',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  currentStep: 'company-info',
  status: SessionStatus.IN_PROGRESS,
  companyData: mockCompanyFormationData,
  metadata: {
    platform: 'darwin',
    lastActivity: '2024-01-01T00:00:00.000Z',
  },
};

export const mockCompletedSession: SessionData = {
  ...mockSessionData,
  sessionId: 'session-completed-67890',
  status: SessionStatus.COMPLETED,
  currentStep: 'confirmation',
};

// ============================================================================
// Agent Response Fixtures
// ============================================================================

export const mockNameCheckAvailable: NameCheckResponse = {
  requestId: 'name-check-123',
  available: true,
  companyName: 'Test Company LLC',
  state: 'DE',
  checkedAt: '2024-01-01T00:00:00.000Z',
};

export const mockNameCheckUnavailable: NameCheckResponse = {
  requestId: 'name-check-456',
  available: false,
  companyName: 'Existing Company LLC',
  state: 'DE',
  checkedAt: '2024-01-01T00:00:00.000Z',
  reason: 'Company name already exists in Delaware',
  suggestions: [
    'Existing Company Group LLC',
    'Existing Company Holdings LLC',
    'New Existing Company LLC',
  ],
  similarNames: [
    {
      name: 'Existing Company LLC',
      similarity: 1.0,
      entityType: 'LLC',
      status: 'active',
    },
    {
      name: 'Existing Company Inc',
      similarity: 0.95,
      entityType: 'Corporation',
      status: 'active',
    },
  ] as SimilarNameInfo[],
};

export const mockDocumentGenerationResponse: DocumentGenerationResponse = {
  documentId: 'doc-123',
  sessionId: 'session-test-12345',
  documentType: DocumentType.ARTICLES_OF_ORGANIZATION,
  status: DocumentStatus.COMPLETED,
  generatedAt: '2024-01-01T00:00:00.000Z',
  downloadUrl: 'https://storage.example.com/documents/doc-123.pdf',
  expiresAt: '2024-01-02T00:00:00.000Z',
  metadata: {
    pageCount: 5,
    fileSize: 102400,
    format: 'PDF',
    checksum: 'abc123def456',
    version: '1.0',
  },
};

export const mockFilingFees: FilingFees = {
  stateFee: 90,
  serviceFee: 49,
  total: 139,
  currency: 'USD',
};

export const mockFilingResponse: FilingResponse = {
  filingId: 'filing-123',
  sessionId: 'session-test-12345',
  status: FilingStatus.COMPLETED,
  state: 'DE',
  submittedAt: '2024-01-01T00:00:00.000Z',
  confirmationNumber: 'DE-2024-123456',
  estimatedCompletionDate: '2024-01-05T00:00:00.000Z',
  fees: mockFilingFees,
  documents: [
    {
      documentType: 'Articles of Organization',
      fileReference: 'doc-123',
      status: 'filed',
      stampedDate: '2024-01-01T00:00:00.000Z',
      downloadUrl: 'https://storage.example.com/filed/doc-123.pdf',
    },
  ],
};

// ============================================================================
// Error Response Fixtures
// ============================================================================

export const mockNetworkError = {
  code: 'NETWORK_ERROR',
  message: 'Network request failed',
  retryable: true,
};

export const mockTimeoutError = {
  code: 'TIMEOUT',
  message: 'Request timeout',
  retryable: true,
};

export const mockValidationError = {
  code: 'VALIDATION_ERROR',
  message: 'Invalid input data',
  retryable: false,
  details: {
    field: 'companyName',
    error: 'Company name contains invalid characters',
  },
};

export const mock429Error = {
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Too many requests',
  retryable: true,
  retryAfter: 60,
};

export const mock500Error = {
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Internal server error',
  retryable: true,
};

// ============================================================================
// Edge Case Data
// ============================================================================

export const mockCompanyNameTooLong = 'A'.repeat(201);

export const mockInvalidSSN = '123-45-67890'; // Too many digits

export const mockInvalidEmail = 'not-an-email';

export const mockInvalidZipCode = '123'; // Too short

export const mockInvalidOwnershipTotal = [
  { ...mockShareholder, ownershipPercentage: 60 },
  { ...mockShareholder, ownershipPercentage: 30 },
  // Total: 90%, should be 100%
];

export const mockMultipleShareholdersExceedingOwnership = [
  { ...mockShareholder, ownershipPercentage: 60 },
  { ...mockShareholder, ownershipPercentage: 50 },
  // Total: 110%, should be 100%
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock session with custom data
 */
export function createMockSession(
  overrides?: Partial<SessionData>
): SessionData {
  return {
    ...mockSessionData,
    ...overrides,
    sessionId: overrides?.sessionId || `session-${Date.now()}`,
  };
}

/**
 * Create a mock name check response
 */
export function createMockNameCheckResponse(
  available: boolean,
  companyName: string = 'Test Company LLC'
): NameCheckResponse {
  return {
    requestId: `name-check-${Date.now()}`,
    available,
    companyName,
    state: 'DE',
    checkedAt: new Date().toISOString(),
    ...(available
      ? {}
      : {
          reason: 'Company name already exists',
          suggestions: [
            `${companyName} Group`,
            `${companyName} Holdings`,
            `New ${companyName}`,
          ],
        }),
  };
}

/**
 * Create mock axios response
 */
export function createMockAxiosResponse<T>(data: T, status: number = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
}

/**
 * Create mock axios error
 */
export function createMockAxiosError(
  status: number,
  message: string,
  code?: string
) {
  const error: any = new Error(message);
  error.isAxiosError = true;
  error.response = {
    status,
    statusText: 'Error',
    data: {
      code: code || `HTTP_${status}`,
      message,
    },
    headers: {},
    config: {} as any,
  };
  return error;
}

/**
 * Wait for a condition to be true (polling helper)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}
