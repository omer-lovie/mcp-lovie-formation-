/**
 * Test Fixtures - Company Formation Data
 * Provides sample data for testing various scenarios
 */

export const validLLCData = {
  companyName: 'Tech Startup LLC',
  companyType: 'LLC' as const,
  state: 'Delaware',
  shareholders: [
    {
      name: 'John Doe',
      address: '123 Main St, Wilmington, DE 19801',
      ownershipPercentage: 60,
      ssn: '123-45-6789',
    },
    {
      name: 'Jane Smith',
      address: '456 Oak Ave, Dover, DE 19901',
      ownershipPercentage: 40,
      ssn: '987-65-4321',
    },
  ],
  registeredAgent: {
    name: 'Delaware Registered Agent Services',
    address: '789 Market St, Wilmington, DE 19801',
    contact: 'agent@example.com',
  },
};

export const validCCorpData = {
  companyName: 'Innovation Corp',
  companyType: 'C-Corp' as const,
  state: 'Delaware',
  shareholders: [
    {
      name: 'Founder LLC',
      address: '100 Corporate Blvd, Wilmington, DE 19801',
      ownershipPercentage: 100,
      ein: '12-3456789',
    },
  ],
  registeredAgent: {
    name: 'Corporate Services Inc',
    address: '200 Legal Way, Wilmington, DE 19801',
    contact: 'services@example.com',
  },
  boardOfDirectors: [
    {
      name: 'Alice Johnson',
      title: 'CEO',
      address: '300 Executive Dr, Wilmington, DE 19801',
    },
  ],
  stockClasses: [
    {
      className: 'Common Stock',
      sharesAuthorized: 10000000,
      parValue: 0.001,
    },
  ],
};

export const validSCorpData = {
  companyName: 'Family Business Inc',
  companyType: 'S-Corp' as const,
  state: 'Delaware',
  shareholders: [
    {
      name: 'Robert Brown',
      address: '400 Business St, Wilmington, DE 19801',
      ownershipPercentage: 50,
      ssn: '111-22-3333',
    },
    {
      name: 'Mary Brown',
      address: '400 Business St, Wilmington, DE 19801',
      ownershipPercentage: 50,
      ssn: '444-55-6666',
    },
  ],
  registeredAgent: {
    name: 'S-Corp Agent Services',
    address: '500 Agent Ln, Wilmington, DE 19801',
    contact: 'scorp@example.com',
  },
};

export const invalidCompanyData = {
  missingName: {
    companyName: '',
    companyType: 'LLC',
    state: 'Delaware',
  },
  invalidSSN: {
    companyName: 'Test Company LLC',
    companyType: 'LLC',
    state: 'Delaware',
    shareholders: [
      {
        name: 'John Doe',
        address: '123 Main St',
        ownershipPercentage: 100,
        ssn: 'invalid-ssn',
      },
    ],
  },
  invalidOwnershipTotal: {
    companyName: 'Test Company LLC',
    companyType: 'LLC',
    state: 'Delaware',
    shareholders: [
      {
        name: 'John Doe',
        address: '123 Main St',
        ownershipPercentage: 60,
        ssn: '123-45-6789',
      },
      {
        name: 'Jane Smith',
        address: '456 Oak Ave',
        ownershipPercentage: 50,
        ssn: '987-65-4321',
      },
    ],
  },
  takenName: {
    companyName: 'Acme LLC',
    companyType: 'LLC',
    state: 'Delaware',
  },
};

export const edgeCaseData = {
  maxShareholders: {
    companyName: 'Many Owners LLC',
    companyType: 'LLC' as const,
    state: 'Delaware',
    shareholders: Array.from({ length: 100 }, (_, i) => ({
      name: `Shareholder ${i + 1}`,
      address: `${i + 1} Test St, Wilmington, DE 19801`,
      ownershipPercentage: 1,
      ssn: `${String(i).padStart(3, '0')}-45-6789`,
    })),
    registeredAgent: {
      name: 'Test Agent',
      address: '789 Market St, Wilmington, DE 19801',
      contact: 'agent@example.com',
    },
  },
  specialCharactersName: {
    companyName: "O'Reilly & Associates, LLC",
    companyType: 'LLC' as const,
    state: 'Delaware',
  },
  unicodeCharacters: {
    companyName: 'Café Société LLC',
    companyType: 'LLC' as const,
    state: 'Delaware',
  },
};

export const multiStateData = {
  california: {
    companyName: 'California Ventures LLC',
    companyType: 'LLC' as const,
    state: 'California',
    shareholders: [validLLCData.shareholders[0]],
    registeredAgent: validLLCData.registeredAgent,
    publicationRequirement: true,
  },
  texas: {
    companyName: 'Texas Holdings LLC',
    companyType: 'LLC' as const,
    state: 'Texas',
    shareholders: [validLLCData.shareholders[0]],
    registeredAgent: validLLCData.registeredAgent,
    franchiseTaxInfo: true,
  },
  newYork: {
    companyName: 'New York Enterprises LLC',
    companyType: 'LLC' as const,
    state: 'New York',
    shareholders: [validLLCData.shareholders[0]],
    registeredAgent: validLLCData.registeredAgent,
    publicationRequirement: true,
    sixWeekPublication: true,
  },
};

export const sessionFixtures = {
  incompleteSession: {
    sessionId: 'session_test_001',
    currentStep: 3,
    collectedData: {
      companyName: 'Incomplete LLC',
      companyType: 'LLC',
      state: 'Delaware',
    },
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    lastUpdated: new Date('2024-01-01T10:15:00Z').toISOString(),
  },
  completedSession: {
    sessionId: 'session_test_002',
    currentStep: 7,
    collectedData: validLLCData,
    paymentCompleted: true,
    filingId: 'filing_test_001',
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    lastUpdated: new Date('2024-01-01T10:45:00Z').toISOString(),
  },
};
