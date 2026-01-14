# Backend Agent API Clients

This directory contains API clients for interacting with backend agents that power the Lovie CLI company formation process.

## Overview

The Lovie CLI delegates specialized tasks to backend agents that handle:

1. **Name Check Agent** - Real-time company name availability verification
2. **Document Filler Agent** - Generation of incorporation documents (PDFs)
3. **Filing Agent** - Submission of documents to state authorities
4. **Payment Agent** - Secure payment processing via Stripe

## Architecture

Each client implements:
- **Retry Logic**: Automatic retries (3 attempts) with exponential backoff
- **Error Handling**: User-friendly error messages and graceful degradation
- **Type Safety**: Full TypeScript typing for requests and responses
- **Loading Indicators**: Callback support for UI progress updates
- **Environment Configuration**: Configuration via environment variables

## Quick Start

### Installation

All necessary dependencies are already installed via the main `package.json`.

### Configuration

Copy `.env.example` to `.env` and configure API endpoints:

```bash
# Name Check Agent
NAME_CHECK_API_URL=https://api.lovie.example.com/name-check
NAME_CHECK_API_KEY=your_api_key_here

# Document Filler Agent
DOCUMENT_FILLER_API_URL=https://api.lovie.example.com/documents
DOCUMENT_FILLER_API_KEY=your_api_key_here

# Filing Agent
FILING_AGENT_API_URL=https://api.lovie.example.com/filing
FILING_AGENT_API_KEY=your_api_key_here

# Payment Gateway (Stripe)
API_BASE_URL=https://api.lovie.example.com
STRIPE_SECRET_KEY=sk_test_...
```

### Usage Examples

#### Name Check Client

```typescript
import { createNameCheckClient } from './services/agents';

const client = createNameCheckClient();

// Check name availability
const result = await client.checkAvailability({
  companyName: 'Acme Corporation',
  state: 'DE',
  companyType: 'LLC'
});

if (result.available) {
  console.log('Name is available!');
} else {
  console.log('Name taken. Try:', result.suggestions);
}
```

#### Document Filler Client

```typescript
import { createDocumentFillerClient } from './services/agents';

const client = createDocumentFillerClient();

// Generate incorporation documents
const result = await client.generateDocuments({
  sessionId: 'session-123',
  companyDetails: {
    name: 'Acme LLC',
    state: 'DE',
    type: 'LLC',
    shareholders: [...],
    registeredAgent: {...}
  },
  documentTypes: ['articles', 'operating-agreement']
});

// Download generated documents
for (const doc of result.documents) {
  const buffer = await client.downloadDocument(doc.documentId);
  fs.writeFileSync(doc.fileName, buffer);
}
```

#### Filing Client

```typescript
import { createFilingClient } from './services/agents';

const client = createFilingClient();

// Submit filing to state
const result = await client.submitFiling({
  sessionId: 'session-123',
  companyDetails: {...},
  documents: [...],
  expedited: true
});

console.log('Filing ID:', result.filingId);
console.log('Confirmation:', result.confirmationNumber);

// Check filing status
const status = await client.getFilingStatus(result.filingId);
console.log('Status:', status.status);
```

#### Payment Client

```typescript
import { createPaymentClient } from './services/agents';

const client = createPaymentClient();

// Process payment
const result = await client.processPayment({
  sessionId: 'session-123',
  amount: 29900, // $299.00 in cents
  currency: 'usd',
  description: 'Delaware LLC Formation',
  paymentMethod: {
    type: 'card',
    cardNumber: '4242424242424242',
    expiryMonth: 12,
    expiryYear: 2025,
    cvv: '123',
    cardholderName: 'John Doe'
  }
});

console.log('Payment ID:', result.paymentId);
console.log('Receipt:', result.receiptUrl);
```

## Features

### Retry Logic

All clients implement automatic retry with exponential backoff:

- **Max Attempts**: 3 (configurable)
- **Initial Delay**: 1-2 seconds
- **Max Delay**: 5-10 seconds
- **Backoff Multiplier**: 2x

Retryable errors include:
- Network failures
- 5xx server errors
- 429 (Too Many Requests)
- 408 (Request Timeout)

### Error Handling

Clients transform technical errors into user-friendly messages:

```typescript
try {
  await client.checkAvailability({...});
} catch (error) {
  // Error message is user-friendly:
  // "Network error: Unable to connect to name check service."
  // "Service temporarily unavailable. Please try again."
  console.error(error.message);
}
```

### Loading Callbacks

Clients support loading callbacks for UI progress indicators:

```typescript
import ora from 'ora';

const spinner = ora();
client.setLoadingCallback((isLoading, message) => {
  if (isLoading) {
    spinner.start(message);
  } else {
    spinner.stop();
  }
});
```

### Progress Tracking

Document and Filing clients support progress callbacks:

```typescript
client.setProgressCallback((progress, message) => {
  console.log(`${progress}%: ${message}`);
});

// Output:
// 10%: Validating company information...
// 50%: Generating documents...
// 100%: Documents generated successfully
```

## API Reference

### Types

All request/response types are defined in `types.ts`:

- `NameCheckRequest` / `NameCheckResponse`
- `DocumentFillerRequest` / `DocumentFillerResponse`
- `FilingRequest` / `FilingResponse`
- `PaymentRequest` / `PaymentResponse`

### Client Configuration

Each client accepts a `ClientConfig`:

```typescript
interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryConfig: RetryConfig;
}
```

### Factory Functions

Each client provides a factory function that reads from environment variables:

- `createNameCheckClient()` → `NameCheckClient`
- `createDocumentFillerClient()` → `DocumentFillerClient`
- `createFilingClient()` → `FilingClient`
- `createPaymentClient()` → `PaymentClient`

## Testing

### Unit Tests

Mock clients for testing:

```typescript
import { NameCheckClient } from './services/agents';

// Mock axios for testing
jest.mock('axios');

test('name check returns available', async () => {
  const client = new NameCheckClient({
    baseUrl: 'http://test',
    timeout: 5000,
    retryConfig: {...}
  });

  // Mock response
  axios.post.mockResolvedValue({
    data: {
      success: true,
      data: {
        available: true,
        companyName: 'Acme LLC',
        state: 'DE',
        checkedAt: new Date().toISOString()
      }
    }
  });

  const result = await client.checkAvailability({
    companyName: 'Acme LLC',
    state: 'DE',
    companyType: 'LLC'
  });

  expect(result.available).toBe(true);
});
```

## Requirements Mapping

These clients fulfill the following functional requirements from the spec:

- **FR-021**: CLI communicates with Name Check Agent for real-time validation
- **FR-022**: CLI communicates with Document Filler Agent for PDF generation
- **FR-023**: CLI communicates with Filing Agent for state submissions
- **FR-024**: System displays real-time status updates (via callbacks)
- **FR-025**: System handles agent errors gracefully
- **FR-035**: System detects network connectivity issues
- **FR-036**: System retries failed API calls (up to 3 attempts)
- **FR-037**: System provides specific error messages for each failure type

## Security

### Environment Variables

**NEVER** commit `.env` files. Always use `.env.example` as a template.

### API Keys

API keys are passed via headers:
- Name Check/Document/Filing: `X-API-Key` header
- Payment: `Authorization: Bearer` header

### Sensitive Data

Payment client sanitizes sensitive data before transmission. In production:
- Use Stripe Elements for client-side card tokenization
- Never log card numbers, CVVs, or SSNs
- Implement PCI DSS compliance measures

## Support

For issues or questions:
- Check error messages (they're designed to be user-friendly)
- Review environment variable configuration
- Verify network connectivity
- Contact backend team for API issues

## License

MIT
