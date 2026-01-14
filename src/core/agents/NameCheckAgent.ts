/**
 * Name Check Agent - Validates company name availability
 * FR-021: CLI MUST communicate with Name Check Agent via API
 * FR-015: System MUST notify user within 5 seconds if name is available
 */

import { State, NameCheckResult, AgentResult } from '../types';

export interface NameCheckRequest {
  name: string;
  state: State;
}

/**
 * Name Check Agent for real-time name validation
 */
export class NameCheckAgent {
  private apiEndpoint: string;
  private timeout: number = 5000; // 5 seconds per FR-015

  constructor(apiEndpoint: string = process.env.NAME_CHECK_API_URL || '') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Check if company name is available in specified state
   * @param request Name and state to check
   * @returns Result with availability and alternatives
   */
  async checkAvailability(
    request: NameCheckRequest
  ): Promise<AgentResult<NameCheckResult>> {
    const startTime = Date.now();

    try {
      // For MVP/development, simulate API call
      // In production, this will call actual state API
      const result = await this.performNameCheck(request);

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Name check failed',
        duration
      };
    }
  }

  /**
   * Perform the actual name check (to be implemented with real API)
   */
  private async performNameCheck(
    request: NameCheckRequest
  ): Promise<NameCheckResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Replace with actual API call
    // This is placeholder logic for development
    const unavailableNames = ['ACME LLC', 'TEST CORP', 'EXAMPLE INC'];
    const isAvailable = !unavailableNames.some(
      name => name.toLowerCase() === request.name.toLowerCase()
    );

    const result: NameCheckResult = {
      available: isAvailable,
      name: request.name,
      state: request.state,
      checkedAt: new Date()
    };

    if (!isAvailable) {
      result.reason = 'Name is already registered in this state';
      result.alternatives = [
        `${request.name} Solutions`,
        `${request.name} Group`,
        `New ${request.name}`
      ];
    }

    return result;
  }

  /**
   * Check multiple names in parallel
   * @param names Array of names to check
   * @param state State to check in
   * @returns Array of results
   */
  async checkMultiple(
    names: string[],
    state: State
  ): Promise<AgentResult<NameCheckResult>[]> {
    const checks = names.map(name =>
      this.checkAvailability({ name, state })
    );

    return Promise.all(checks);
  }

  /**
   * Suggest alternative names based on unavailable name
   * @param baseName Original name that was unavailable
   * @param state State to check in
   * @returns Array of available alternatives
   */
  async suggestAlternatives(
    baseName: string,
    state: State
  ): Promise<string[]> {
    const variations = [
      `${baseName} Solutions`,
      `${baseName} Group`,
      `${baseName} Enterprises`,
      `The ${baseName} Company`,
      `${baseName} Inc`,
      `New ${baseName}`
    ];

    const results = await this.checkMultiple(variations, state);

    return results
      .filter(r => r.success && r.data?.available)
      .map(r => r.data!.name);
  }

  /**
   * Validate name format (before checking availability)
   * @param name Company name to validate
   * @param type Company type for suffix validation
   * @returns Validation result
   */
  validateNameFormat(name: string, type: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check minimum length
    if (name.length < 3) {
      errors.push('Company name must be at least 3 characters');
    }

    // Check maximum length
    if (name.length > 200) {
      errors.push('Company name must be less than 200 characters');
    }

    // Check for prohibited characters
    const prohibitedChars = /[<>{}[\]\\\/]/;
    if (prohibitedChars.test(name)) {
      errors.push('Company name contains prohibited characters');
    }

    // Check for required suffix based on type
    const llcSuffixes = ['LLC', 'L.L.C.', 'Limited Liability Company'];
    const corpSuffixes = ['Corp', 'Corporation', 'Inc', 'Incorporated'];

    const hasLLCSuffix = llcSuffixes.some(suffix =>
      name.toUpperCase().includes(suffix.toUpperCase())
    );
    const hasCorpSuffix = corpSuffixes.some(suffix =>
      name.toUpperCase().includes(suffix.toUpperCase())
    );

    if (type.toLowerCase().includes('llc') && !hasLLCSuffix) {
      errors.push('LLC name must include LLC, L.L.C., or Limited Liability Company');
    } else if (type.toLowerCase().includes('corp') && !hasCorpSuffix) {
      errors.push('Corporation name must include Corp, Corporation, Inc, or Incorporated');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
