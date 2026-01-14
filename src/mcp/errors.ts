// Error codes for MCP tools
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',

  // Session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID_STATE = 'SESSION_INVALID_STATE',
  SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',

  // API errors
  API_TIMEOUT = 'API_TIMEOUT',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  API_ERROR = 'API_ERROR',

  // Name check errors
  NAME_CHECK_FAILED = 'NAME_CHECK_FAILED',
  NAME_UNAVAILABLE = 'NAME_UNAVAILABLE',

  // Certificate errors
  CERTIFICATE_GENERATION_FAILED = 'CERTIFICATE_GENERATION_FAILED',
  CERTIFICATE_NOT_GENERATED = 'CERTIFICATE_NOT_GENERATED',
  CERTIFICATE_URL_EXPIRED = 'CERTIFICATE_URL_EXPIRED',

  // Sync errors
  SYNC_FAILED = 'SYNC_FAILED',

  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface MCPErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
  suggestion?: string;
}

export class MCPToolError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;
  retryable?: boolean;
  suggestion?: string;

  constructor(errorDetails: MCPErrorDetails) {
    super(errorDetails.message);
    this.name = 'MCPToolError';
    this.code = errorDetails.code;
    this.details = errorDetails.details;
    this.retryable = errorDetails.retryable;
    this.suggestion = errorDetails.suggestion;
  }

  toJSON() {
    return {
      error: true,
      code: this.code,
      message: this.message,
      details: this.details,
      retryable: this.retryable,
      suggestion: this.suggestion,
    };
  }
}

// Helper functions for common errors
export function sessionNotFound(sessionId: string): MCPToolError {
  return new MCPToolError({
    code: ErrorCode.SESSION_NOT_FOUND,
    message: `Session not found: ${sessionId}`,
    details: { sessionId },
    retryable: false,
    suggestion: 'Create a new session using formation_start',
  });
}

export function sessionExpired(sessionId: string): MCPToolError {
  return new MCPToolError({
    code: ErrorCode.SESSION_EXPIRED,
    message: `Session has expired: ${sessionId}`,
    details: { sessionId },
    retryable: false,
    suggestion: 'Create a new session using formation_start',
  });
}

export function validationError(field: string, message: string): MCPToolError {
  return new MCPToolError({
    code: ErrorCode.VALIDATION_ERROR,
    message: `Validation error for ${field}: ${message}`,
    details: { field },
    retryable: true,
    suggestion: `Please provide a valid value for ${field}`,
  });
}

export function requiredFieldError(field: string): MCPToolError {
  return new MCPToolError({
    code: ErrorCode.VALIDATION_REQUIRED_FIELD,
    message: `Required field missing: ${field}`,
    details: { field },
    retryable: true,
    suggestion: `Please provide the required field: ${field}`,
  });
}

export function apiTimeout(service: string): MCPToolError {
  return new MCPToolError({
    code: ErrorCode.API_TIMEOUT,
    message: `API timeout while calling ${service}`,
    details: { service },
    retryable: true,
    suggestion: 'Please try again in a few moments',
  });
}

export function invalidState(expectedStep: string, currentStep: string): MCPToolError {
  return new MCPToolError({
    code: ErrorCode.SESSION_INVALID_STATE,
    message: `Invalid session state. Expected: ${expectedStep}, Current: ${currentStep}`,
    details: { expectedStep, currentStep },
    retryable: false,
    suggestion: 'Complete the required previous steps first',
  });
}
