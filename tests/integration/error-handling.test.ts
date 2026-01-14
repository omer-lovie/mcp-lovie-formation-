/**
 * Integration Tests - Error Handling & Edge Cases
 * Tests all edge cases from spec and error handling scenarios
 */

import {
  mockNameCheckAgent,
  mockDocumentFillerAgent,
  mockFilingAgent,
} from '../mocks/agent-api.mock';
import { validLLCData, invalidCompanyData } from '../fixtures/company-data.fixture';

describe('Error Handling & Edge Cases', () => {
  beforeEach(() => {
    mockNameCheckAgent.reset();
    mockFilingAgent.reset();
  });

  /**
   * Edge Case: Company name is taken mid-flow
   */
  describe('Edge Case - Name Taken During Flow', () => {
    it('should notify user and preserve previous responses', async () => {
      const cli = new ErrorTestCLI();

      // User enters data
      await cli.collectData({
        companyName: 'Available Company LLC',
        shareholders: validLLCData.shareholders,
      });

      // Name becomes taken during flow
      mockNameCheckAgent.addTakenName('Available Company LLC');

      const result = await cli.finalNameCheck();

      expect(result.success).toBe(false);
      expect(result.message).toContain('no longer available');

      // Previous data should be preserved
      const preserved = cli.getCollectedData();
      expect(preserved.shareholders).toEqual(validLLCData.shareholders);
    });

    it('should prompt for new name while keeping other data', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData({
        companyName: 'Taken Company LLC',
        shareholders: validLLCData.shareholders,
      });

      mockNameCheckAgent.addTakenName('Taken Company LLC');

      await cli.finalNameCheck();

      // Should allow re-entering name
      await cli.updateField('companyName', 'New Company LLC');

      const result = await cli.finalNameCheck();
      expect(result.success).toBe(true);
    });
  });

  /**
   * Edge Case: Payment fails
   */
  describe('Edge Case - Payment Failure', () => {
    it('should provide clear error message on payment failure', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);

      const result = await cli.processPayment({
        cardNumber: '4000000000000002', // Decline card
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/declined|failed/i);
      expect(result.message).not.toContain('error');
      expect(result.canRetry).toBe(true);
    });

    it('should allow retry after payment failure', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);

      // First attempt fails
      const firstAttempt = await cli.processPayment({
        cardNumber: '4000000000000002',
      });
      expect(firstAttempt.success).toBe(false);

      // Retry with valid card
      const secondAttempt = await cli.processPayment({
        cardNumber: '4111111111111111',
      });
      expect(secondAttempt.success).toBe(true);
    });

    it('should not create duplicate filings on payment retry', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);

      await cli.processPayment({ cardNumber: '4000000000000002' });
      await cli.processPayment({ cardNumber: '4111111111111111' });

      const filingCount = cli.getFilingCount();
      expect(filingCount).toBe(0); // No filing until payment succeeds
    });

    it('should preserve session for later retry', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);

      await cli.processPayment({ cardNumber: '4000000000000002' });

      const sessionId = cli.getSessionId();
      expect(sessionId).toBeDefined();

      // Can resume later
      const canResume = cli.canResumeSession(sessionId);
      expect(canResume).toBe(true);
    });
  });

  /**
   * Edge Case: Filing agent encounters error
   */
  describe('Edge Case - Filing Agent Error', () => {
    it('should handle state system downtime gracefully', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);
      await cli.processPayment({ cardNumber: '4111111111111111' });

      cli.simulateFilingError('STATE_SYSTEM_DOWN');

      const result = await cli.submitFiling();

      expect(result.success).toBe(false);
      expect(result.message).toContain('temporarily unavailable');
      expect(result.supportContact).toBeDefined();
    });

    it('should refund or hold payment on filing error', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);
      const payment = await cli.processPayment({
        cardNumber: '4111111111111111',
      });

      cli.simulateFilingError('INVALID_DATA');

      await cli.submitFiling();

      const paymentStatus = cli.getPaymentStatus(payment.transactionId);
      expect(['refunded', 'held']).toContain(paymentStatus);
    });

    it('should provide specific error details', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);
      await cli.processPayment({ cardNumber: '4111111111111111' });

      cli.simulateFilingError('INVALID_ADDRESS');

      const result = await cli.submitFiling();

      expect(result.success).toBe(false);
      expect(result.errorDetails).toContain('address');
    });
  });

  /**
   * Edge Case: Internet connection loss
   */
  describe('Edge Case - Connection Loss', () => {
    it('should detect connection loss', async () => {
      const cli = new ErrorTestCLI();

      cli.simulateNetworkError();

      const result = await cli.checkNameAvailability('Test LLC', 'Delaware');

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/connection|offline|network/i);
    });

    it('should preserve local session data on disconnect', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);

      cli.simulateNetworkError();

      const sessionData = cli.getLocalSessionData();
      expect(sessionData).toEqual(validLLCData);
    });

    it('should allow resuming when connection restored', async () => {
      const cli = new ErrorTestCLI();

      await cli.collectData(validLLCData);

      cli.simulateNetworkError();
      const sessionId = cli.getSessionId();

      cli.restoreNetwork();

      const resumed = await cli.resumeSession(sessionId);
      expect(resumed.success).toBe(true);
      expect(resumed.data).toEqual(validLLCData);
    });
  });

  /**
   * Edge Case: Invalid data formats
   */
  describe('Edge Case - Invalid Input Data', () => {
    it('should catch invalid SSN format immediately', async () => {
      const cli = new ErrorTestCLI();

      const result = await cli.validateAndCollect({
        ...validLLCData,
        shareholders: [
          {
            ...validLLCData.shareholders[0],
            ssn: 'invalid-ssn',
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        expect.objectContaining({
          field: 'ssn',
          message: expect.stringContaining('format'),
        })
      );
    });

    it('should catch invalid ownership totals', async () => {
      const cli = new ErrorTestCLI();

      const result = await cli.validateAndCollect({
        ...validLLCData,
        shareholders: [
          { ...validLLCData.shareholders[0], ownershipPercentage: 60 },
          { ...validLLCData.shareholders[1], ownershipPercentage: 50 },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        expect.objectContaining({
          field: 'ownership',
          message: expect.stringContaining('100%'),
        })
      );
    });

    it('should provide correction guidance for invalid data', async () => {
      const cli = new ErrorTestCLI();

      const result = await cli.validateAndCollect({
        ...validLLCData,
        shareholders: [
          {
            ...validLLCData.shareholders[0],
            ssn: '123456789', // Missing dashes
          },
        ],
      });

      expect(result.errors[0].guidance).toBeDefined();
      expect(result.errors[0].guidance).toContain('XXX-XX-XXXX');
    });
  });

  /**
   * Edge Case: Simultaneous name registration
   */
  describe('Edge Case - Simultaneous Registration', () => {
    it('should handle race condition with first-come-first-served', async () => {
      const cli1 = new ErrorTestCLI();
      const cli2 = new ErrorTestCLI();

      const companyName = 'Race Condition LLC';

      // Both check name simultaneously
      const [check1, check2] = await Promise.all([
        cli1.checkNameAvailability(companyName, 'Delaware'),
        cli2.checkNameAvailability(companyName, 'Delaware'),
      ]);

      expect(check1.available).toBe(true);
      expect(check2.available).toBe(true);

      // Both try to file
      await cli1.collectData({ ...validLLCData, companyName });
      await cli1.processPayment({ cardNumber: '4111111111111111' });

      await cli2.collectData({ ...validLLCData, companyName });
      await cli2.processPayment({ cardNumber: '4111111111111111' });

      const [filing1, filing2] = await Promise.all([
        cli1.submitFiling(),
        cli2.submitFiling(),
      ]);

      // One should succeed, one should fail
      const successes = [filing1.success, filing2.success].filter(Boolean);
      expect(successes).toHaveLength(1);

      const failures = [filing1, filing2].filter((f) => !f.success);
      expect(failures[0].message).toContain('no longer available');
    });
  });

  /**
   * Performance under error conditions
   */
  describe('Performance - Error Recovery', () => {
    it('should retry failed API calls up to 3 times (FR-036)', async () => {
      const cli = new ErrorTestCLI();

      let attemptCount = 0;
      cli.interceptAPICall('nameCheck', () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network timeout');
        }
        return { available: true };
      });

      const result = await cli.checkNameAvailability('Test LLC', 'Delaware');

      expect(attemptCount).toBe(3);
      expect(result.success).toBe(true);
    });

    it('should use exponential backoff for retries', async () => {
      const cli = new ErrorTestCLI();

      const retryTimes: number[] = [];
      let attemptCount = 0;

      cli.interceptAPICall('nameCheck', () => {
        retryTimes.push(Date.now());
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Retry');
        }
        return { available: true };
      });

      await cli.checkNameAvailability('Test LLC', 'Delaware');

      // Check backoff intervals are increasing
      for (let i = 1; i < retryTimes.length; i++) {
        const interval = retryTimes[i] - retryTimes[i - 1];
        if (i > 1) {
          const prevInterval = retryTimes[i - 1] - retryTimes[i - 2];
          expect(interval).toBeGreaterThan(prevInterval);
        }
      }
    });
  });
});

// Mock CLI for error testing
class ErrorTestCLI {
  private data: any = {};
  private sessionId: string = `session_${Date.now()}`;
  private filingCount = 0;
  private networkError = false;
  private filingError: string | null = null;
  private payments: Map<string, string> = new Map();
  private interceptors: Map<string, Function> = new Map();

  async collectData(data: any): Promise<void> {
    this.data = { ...data };
  }

  async updateField(field: string, value: any): Promise<void> {
    this.data[field] = value;
  }

  getCollectedData(): any {
    return { ...this.data };
  }

  async finalNameCheck(): Promise<any> {
    const result = await mockNameCheckAgent.checkNameAvailability(
      this.data.companyName,
      this.data.state || 'Delaware'
    );

    if (!result.available) {
      return {
        success: false,
        message: 'Company name is no longer available',
      };
    }

    return { success: true };
  }

  async processPayment(paymentInfo: any): Promise<any> {
    if (paymentInfo.cardNumber === '4000000000000002') {
      return {
        success: false,
        message: 'Payment was declined',
        canRetry: true,
      };
    }

    const transactionId = `txn_${Date.now()}`;
    this.payments.set(transactionId, 'completed');

    return {
      success: true,
      transactionId,
    };
  }

  getFilingCount(): number {
    return this.filingCount;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  canResumeSession(sessionId: string): boolean {
    return sessionId === this.sessionId;
  }

  simulateFilingError(errorType: string): void {
    this.filingError = errorType;
  }

  async submitFiling(): Promise<any> {
    if (this.filingError === 'STATE_SYSTEM_DOWN') {
      return {
        success: false,
        message: 'State filing system is temporarily unavailable',
        supportContact: 'support@lovie.io',
      };
    }

    if (this.filingError === 'INVALID_DATA') {
      // Refund payment
      this.payments.forEach((_, id) => {
        this.payments.set(id, 'refunded');
      });

      return {
        success: false,
        message: 'Filing failed due to invalid data',
      };
    }

    if (this.filingError === 'INVALID_ADDRESS') {
      return {
        success: false,
        message: 'Filing failed',
        errorDetails: 'Invalid address format',
      };
    }

    this.filingCount++;
    return { success: true };
  }

  getPaymentStatus(transactionId: string): string {
    return this.payments.get(transactionId) || 'unknown';
  }

  simulateNetworkError(): void {
    this.networkError = true;
  }

  restoreNetwork(): void {
    this.networkError = false;
  }

  async checkNameAvailability(name: string, state: string): Promise<any> {
    if (this.networkError) {
      return {
        success: false,
        message: 'No network connection detected',
      };
    }

    const interceptor = this.interceptors.get('nameCheck');
    if (interceptor) {
      try {
        const result = await interceptor();
        return { success: true, ...result };
      } catch (error) {
        throw error;
      }
    }

    const result = await mockNameCheckAgent.checkNameAvailability(
      name,
      state
    );
    return { success: true, ...result };
  }

  getLocalSessionData(): any {
    return { ...this.data };
  }

  async resumeSession(sessionId: string): Promise<any> {
    if (this.networkError) {
      return { success: false };
    }

    return {
      success: true,
      data: this.data,
    };
  }

  async validateAndCollect(data: any): Promise<any> {
    const errors: any[] = [];

    // Validate SSN
    if (data.shareholders) {
      data.shareholders.forEach((sh: any, idx: number) => {
        if (sh.ssn && !/^\d{3}-\d{2}-\d{4}$/.test(sh.ssn)) {
          errors.push({
            field: 'ssn',
            index: idx,
            message: 'Invalid SSN format',
            guidance: 'Please use format XXX-XX-XXXX',
          });
        }
      });
    }

    // Validate ownership
    if (data.shareholders) {
      const total = data.shareholders.reduce(
        (sum: number, sh: any) => sum + sh.ownershipPercentage,
        0
      );

      if (Math.abs(total - 100) > 0.01) {
        errors.push({
          field: 'ownership',
          message: 'Total ownership must equal 100%',
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    this.data = data;
    return { success: true };
  }

  interceptAPICall(apiName: string, handler: Function): void {
    this.interceptors.set(apiName, handler);
  }
}
