"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPToolError = exports.ErrorCode = void 0;
exports.sessionNotFound = sessionNotFound;
exports.sessionExpired = sessionExpired;
exports.validationError = validationError;
exports.requiredFieldError = requiredFieldError;
exports.apiTimeout = apiTimeout;
exports.invalidState = invalidState;
// Error codes for MCP tools
var ErrorCode;
(function (ErrorCode) {
    // Validation errors
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["VALIDATION_REQUIRED_FIELD"] = "VALIDATION_REQUIRED_FIELD";
    ErrorCode["VALIDATION_INVALID_FORMAT"] = "VALIDATION_INVALID_FORMAT";
    ErrorCode["VALIDATION_OUT_OF_RANGE"] = "VALIDATION_OUT_OF_RANGE";
    // Session errors
    ErrorCode["SESSION_NOT_FOUND"] = "SESSION_NOT_FOUND";
    ErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    ErrorCode["SESSION_INVALID_STATE"] = "SESSION_INVALID_STATE";
    ErrorCode["SESSION_ALREADY_COMPLETED"] = "SESSION_ALREADY_COMPLETED";
    // API errors
    ErrorCode["API_TIMEOUT"] = "API_TIMEOUT";
    ErrorCode["API_UNAVAILABLE"] = "API_UNAVAILABLE";
    ErrorCode["API_ERROR"] = "API_ERROR";
    // Name check errors
    ErrorCode["NAME_CHECK_FAILED"] = "NAME_CHECK_FAILED";
    ErrorCode["NAME_UNAVAILABLE"] = "NAME_UNAVAILABLE";
    // Certificate errors
    ErrorCode["CERTIFICATE_GENERATION_FAILED"] = "CERTIFICATE_GENERATION_FAILED";
    ErrorCode["CERTIFICATE_NOT_GENERATED"] = "CERTIFICATE_NOT_GENERATED";
    ErrorCode["CERTIFICATE_URL_EXPIRED"] = "CERTIFICATE_URL_EXPIRED";
    // Sync errors
    ErrorCode["SYNC_FAILED"] = "SYNC_FAILED";
    // Internal errors
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class MCPToolError extends Error {
    constructor(errorDetails) {
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
exports.MCPToolError = MCPToolError;
// Helper functions for common errors
function sessionNotFound(sessionId) {
    return new MCPToolError({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: `Session not found: ${sessionId}`,
        details: { sessionId },
        retryable: false,
        suggestion: 'Create a new session using formation_start',
    });
}
function sessionExpired(sessionId) {
    return new MCPToolError({
        code: ErrorCode.SESSION_EXPIRED,
        message: `Session has expired: ${sessionId}`,
        details: { sessionId },
        retryable: false,
        suggestion: 'Create a new session using formation_start',
    });
}
function validationError(field, message) {
    return new MCPToolError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Validation error for ${field}: ${message}`,
        details: { field },
        retryable: true,
        suggestion: `Please provide a valid value for ${field}`,
    });
}
function requiredFieldError(field) {
    return new MCPToolError({
        code: ErrorCode.VALIDATION_REQUIRED_FIELD,
        message: `Required field missing: ${field}`,
        details: { field },
        retryable: true,
        suggestion: `Please provide the required field: ${field}`,
    });
}
function apiTimeout(service) {
    return new MCPToolError({
        code: ErrorCode.API_TIMEOUT,
        message: `API timeout while calling ${service}`,
        details: { service },
        retryable: true,
        suggestion: 'Please try again in a few moments',
    });
}
function invalidState(expectedStep, currentStep) {
    return new MCPToolError({
        code: ErrorCode.SESSION_INVALID_STATE,
        message: `Invalid session state. Expected: ${expectedStep}, Current: ${currentStep}`,
        details: { expectedStep, currentStep },
        retryable: false,
        suggestion: 'Complete the required previous steps first',
    });
}
//# sourceMappingURL=errors.js.map