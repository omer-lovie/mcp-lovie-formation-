export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    VALIDATION_REQUIRED_FIELD = "VALIDATION_REQUIRED_FIELD",
    VALIDATION_INVALID_FORMAT = "VALIDATION_INVALID_FORMAT",
    VALIDATION_OUT_OF_RANGE = "VALIDATION_OUT_OF_RANGE",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    SESSION_INVALID_STATE = "SESSION_INVALID_STATE",
    SESSION_ALREADY_COMPLETED = "SESSION_ALREADY_COMPLETED",
    API_TIMEOUT = "API_TIMEOUT",
    API_UNAVAILABLE = "API_UNAVAILABLE",
    API_ERROR = "API_ERROR",
    NAME_CHECK_FAILED = "NAME_CHECK_FAILED",
    NAME_UNAVAILABLE = "NAME_UNAVAILABLE",
    CERTIFICATE_GENERATION_FAILED = "CERTIFICATE_GENERATION_FAILED",
    CERTIFICATE_NOT_GENERATED = "CERTIFICATE_NOT_GENERATED",
    CERTIFICATE_URL_EXPIRED = "CERTIFICATE_URL_EXPIRED",
    SYNC_FAILED = "SYNC_FAILED",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
export interface MCPErrorDetails {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    retryable?: boolean;
    suggestion?: string;
}
export declare class MCPToolError extends Error {
    code: ErrorCode;
    details?: Record<string, unknown>;
    retryable?: boolean;
    suggestion?: string;
    constructor(errorDetails: MCPErrorDetails);
    toJSON(): {
        error: boolean;
        code: ErrorCode;
        message: string;
        details: Record<string, unknown> | undefined;
        retryable: boolean | undefined;
        suggestion: string | undefined;
    };
}
export declare function sessionNotFound(sessionId: string): MCPToolError;
export declare function sessionExpired(sessionId: string): MCPToolError;
export declare function validationError(field: string, message: string): MCPToolError;
export declare function requiredFieldError(field: string): MCPToolError;
export declare function apiTimeout(service: string): MCPToolError;
export declare function invalidState(expectedStep: string, currentStep: string): MCPToolError;
//# sourceMappingURL=errors.d.ts.map