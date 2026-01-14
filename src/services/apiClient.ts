/**
 * API client for communicating with backend agents
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { NameCheckResult, Company, FilingResult } from '../types';

export class ApiClient {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number;

  constructor() {
    this.baseURL = process.env.LOVIE_API_URL || 'https://api.lovie.io';
    this.timeout = 30000; // 30 seconds

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Lovie-CLI/1.0.0'
      }
    });

    // Add retry logic
    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add API key if available
        const apiKey = process.env.LOVIE_API_KEY;
        if (apiKey) {
          config.headers.Authorization = `Bearer ${apiKey}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;

        // Retry up to 3 times on network errors
        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry < 3 && this.isRetryableError(error)) {
          config.retry += 1;

          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, config.retry - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      // Network error
      return true;
    }

    const status = error.response.status;
    // Retry on 5xx errors and rate limiting
    return status >= 500 || status === 429;
  }

  /**
   * Check company name availability
   */
  async checkNameAvailability(name: string, state: string): Promise<NameCheckResult> {
    try {
      const response = await this.client.post<NameCheckResult>('/name-check', {
        name,
        state
      });

      return response.data;
    } catch (error) {
      console.error('Error checking name availability:', error);

      // Return a fallback response
      return {
        available: false,
        message: 'Unable to check name availability. Please try again.',
        suggestedNames: []
      };
    }
  }

  /**
   * Generate incorporation documents
   */
  async generateDocuments(company: Company): Promise<{ documentUrl: string; documentId: string }> {
    try {
      const response = await this.client.post('/documents/generate', {
        company
      });

      return {
        documentUrl: response.data.documentUrl,
        documentId: response.data.documentId
      };
    } catch (error) {
      console.error('Error generating documents:', error);
      throw new Error('Failed to generate incorporation documents. Please try again.');
    }
  }

  /**
   * Process payment
   */
  async processPayment(sessionId: string, paymentToken: string): Promise<{ transactionId: string; success: boolean }> {
    try {
      const response = await this.client.post('/payment/process', {
        sessionId,
        paymentToken
      });

      return {
        transactionId: response.data.transactionId,
        success: response.data.success
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Payment processing failed. Your card was not charged. Please try again.');
    }
  }

  /**
   * Submit filing to state
   */
  async submitFiling(company: Company, documentId: string): Promise<FilingResult> {
    try {
      const response = await this.client.post<FilingResult>('/filing/submit', {
        company,
        documentId
      });

      return response.data;
    } catch (error) {
      console.error('Error submitting filing:', error);
      throw new Error('Failed to submit filing to state. Please contact support.');
    }
  }

  /**
   * Get filing status
   */
  async getFilingStatus(filingNumber: string): Promise<FilingResult> {
    try {
      const response = await this.client.get<FilingResult>(`/filing/status/${filingNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error getting filing status:', error);
      throw new Error('Failed to retrieve filing status. Please try again.');
    }
  }

  /**
   * Send session data to backend
   */
  async syncSession(sessionId: string, sessionData: any): Promise<boolean> {
    try {
      await this.client.post('/session/sync', {
        sessionId,
        data: sessionData
      });
      return true;
    } catch (error) {
      console.error('Error syncing session:', error);
      return false;
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
