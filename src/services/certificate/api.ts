/**
 * Certificate API Client
 * Handles communication with the certificate generation API
 * Feature 002: FR-001, FR-002, FR-003
 * Updated: Now supports both C-Corp (Certificate of Incorporation) and LLC (Certificate of Formation)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  CertificateGenerationRequest,
  CertificateGenerationResponse,
  CertificateApiConfig
} from './types';

const DEFAULT_API_URL = 'https://helpful-beauty-production.up.railway.app/api/v1';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Certificate API Client
 * Communicates with the certificate generation service
 */
export class CertificateApiClient {
  private client: AxiosInstance;

  constructor(config?: CertificateApiConfig) {
    this.client = axios.create({
      baseURL: config?.baseUrl || DEFAULT_API_URL,
      timeout: config?.timeout || DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate certificate (Certificate of Incorporation for Corps, Certificate of Formation for LLCs)
   * POST /certificates
   * @param request - Certificate generation request payload
   * @returns Certificate generation response with download URL
   */
  async generateCertificate(
    request: CertificateGenerationRequest
  ): Promise<CertificateGenerationResponse> {
    try {
      // Validate request payload
      this.validateRequest(request);

      // Call certificate generation API
      const response = await this.client.post<CertificateGenerationResponse>(
        '/certificates',
        request
      );

      // Validate response structure
      this.validateResponse(response.data);

      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Validate certificate generation request
   * Validates based on company type (LLC vs C-Corp/S-Corp)
   */
  private validateRequest(request: CertificateGenerationRequest): void {
    const errors: string[] = [];

    // Validate company type
    if (!request.companyType) {
      errors.push('Company type is required');
    } else if (!['c-corp', 's-corp', 'llc'].includes(request.companyType)) {
      errors.push('Company type must be c-corp, s-corp, or llc');
    }

    // Validate company name (required for all)
    if (!request.companyName?.trim()) {
      errors.push('Company name is required');
    }

    // Validate registered agent (required for all)
    if (!request.registeredAgent?.name?.trim()) {
      errors.push('Registered agent name is required');
    }

    if (!request.registeredAgent?.address) {
      errors.push('Registered agent address is required');
    } else {
      const addr = request.registeredAgent.address;
      if (!addr.street?.trim()) errors.push('Registered agent street is required');
      if (!addr.city?.trim()) errors.push('Registered agent city is required');
      if (!addr.state?.trim()) errors.push('Registered agent state is required');
      if (!addr.zipCode?.trim()) errors.push('Registered agent zip code is required');

      // County is required for C-Corp and S-Corp
      if (request.companyType !== 'llc' && !addr.county?.trim()) {
        errors.push('Registered agent county is required for corporations');
      }
    }

    // Validate C-Corp/S-Corp specific fields
    if (request.companyType === 'c-corp' || request.companyType === 's-corp') {
      // Shares are required for corporations
      if (typeof request.authorizedShares !== 'number') {
        errors.push('Authorized shares is required for corporations');
      } else if (request.authorizedShares <= 0) {
        errors.push('Authorized shares must be greater than 0');
      }

      // Par value is required for corporations (as string)
      if (!request.parValue) {
        errors.push('Par value is required for corporations');
      }

      // Incorporator is required for corporations
      if (!request.incorporator?.name?.trim()) {
        errors.push('Incorporator name is required for corporations');
      }
      if (!request.incorporator?.address) {
        errors.push('Incorporator address is required for corporations');
      } else {
        const incAddr = request.incorporator.address;
        if (!incAddr.street?.trim()) errors.push('Incorporator street is required');
        if (!incAddr.city?.trim()) errors.push('Incorporator city is required');
        if (!incAddr.state?.trim()) errors.push('Incorporator state is required');
        if (!incAddr.zipCode?.trim()) errors.push('Incorporator zip code is required');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Invalid certificate request: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate certificate generation response
   */
  private validateResponse(response: CertificateGenerationResponse): void {
    const errors: string[] = [];

    if (!response.success) {
      errors.push('API returned success=false');
    }

    if (!response.certificateId) {
      errors.push('Missing certificateId');
    }

    if (!response.downloadUrl) {
      errors.push('Missing downloadUrl');
    }

    if (!response.s3Uri) {
      errors.push('Missing s3Uri');
    }

    if (!response.expiresAt) {
      errors.push('Missing expiresAt');
    }

    if (!response.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!response.metadata.companyName) errors.push('Missing metadata.companyName');
      if (!response.metadata.generatedAt) errors.push('Missing metadata.generatedAt');
      if (typeof response.metadata.fileSize !== 'number') errors.push('Missing metadata.fileSize');
      if (!response.metadata.fileHash) errors.push('Missing metadata.fileHash');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid API response: ${errors.join(', ')}`);
    }
  }

  /**
   * Handle API errors with user-friendly messages
   */
  private handleApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network errors
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return new Error(
          'Certificate generation service timed out. Please check your internet connection and try again.'
        );
      }

      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        return new Error(
          'Unable to connect to certificate generation service. Please try again later.'
        );
      }

      // HTTP errors
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        if (status === 400) {
          return new Error(
            `Invalid request data: ${data?.message || 'Please check your company information'}`
          );
        }

        if (status === 401 || status === 403) {
          return new Error('Authentication failed. Please contact support.');
        }

        if (status === 404) {
          return new Error('Certificate generation endpoint not found. Please contact support.');
        }

        if (status === 429) {
          return new Error('Too many requests. Please wait a moment and try again.');
        }

        if (status >= 500) {
          return new Error(
            'Certificate generation service is temporarily unavailable. Please try again in a few minutes.'
          );
        }

        return new Error(
          `Certificate generation failed: ${data?.message || `HTTP ${status}`}`
        );
      }

      return new Error(
        `Certificate generation request failed: ${axiosError.message}`
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error('An unexpected error occurred during certificate generation');
  }

  /**
   * Check if a download URL has expired
   * @param expiresAt - Expiration timestamp from API response
   * @returns True if the URL has expired
   */
  isUrlExpired(expiresAt: string | Date): boolean {
    const expirationDate = typeof expiresAt === 'string'
      ? new Date(expiresAt)
      : expiresAt;

    return new Date() >= expirationDate;
  }

  /**
   * Calculate time remaining until URL expires
   * @param expiresAt - Expiration timestamp from API response
   * @returns Minutes remaining, or 0 if expired
   */
  getMinutesRemaining(expiresAt: string | Date): number {
    const expirationDate = typeof expiresAt === 'string'
      ? new Date(expiresAt)
      : expiresAt;

    const now = new Date();
    const remaining = expirationDate.getTime() - now.getTime();

    if (remaining <= 0) {
      return 0;
    }

    return Math.floor(remaining / (60 * 1000));
  }
}
