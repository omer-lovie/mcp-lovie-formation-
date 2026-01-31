"use strict";
/**
 * Shared types and interfaces for backend agent API clients
 * @module services/agents/types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RETRY_CONFIG = exports.AgentError = exports.DocumentStatus = exports.DocumentType = exports.FilingStatus = exports.COMPANY_TYPE_TO_DELAWARE = exports.DELAWARE_ENTITY_TYPES = void 0;
exports.isNameAvailable = isNameAvailable;
/**
 * Delaware entity type configurations
 */
exports.DELAWARE_ENTITY_TYPES = {
    'C': {
        code: 'C',
        name: 'Corporation',
        requiresEnding: true,
        validEndings: ['Inc.', 'Corp.', 'Corporation', 'Incorporated', 'Company', 'Co.', 'Limited', 'Ltd.'],
        defaultEnding: 'Inc.'
    },
    'Y': {
        code: 'Y',
        name: 'LLC',
        requiresEnding: true,
        validEndings: ['LLC', 'L.L.C.', 'Limited Liability Company'],
        defaultEnding: 'LLC'
    },
    'L': {
        code: 'L',
        name: 'Limited Partnership',
        requiresEnding: true,
        validEndings: ['LP', 'L.P.', 'Limited Partnership'],
        defaultEnding: 'LP'
    },
    'P': {
        code: 'P',
        name: 'LLP',
        requiresEnding: true,
        validEndings: ['LLP', 'L.L.P.', 'Limited Liability Partnership'],
        defaultEnding: 'LLP'
    },
    'G': {
        code: 'G',
        name: 'General Partnership',
        requiresEnding: false,
        validEndings: ['Partnership', 'GP'],
        defaultEnding: ''
    },
    'T': {
        code: 'T',
        name: 'Statutory Trust',
        requiresEnding: false,
        validEndings: ['Trust', 'Statutory Trust'],
        defaultEnding: ''
    }
};
/**
 * Company type to Delaware entity type mapping
 */
exports.COMPANY_TYPE_TO_DELAWARE = {
    'LLC': 'Y',
    'C-Corp': 'C',
    'S-Corp': 'C', // S-Corp is tax status, same formation as C-Corp
    'LP': 'L',
    'LLP': 'P',
    'GP': 'G',
    'Trust': 'T'
};
/**
 * Filing status types
 */
var FilingStatus;
(function (FilingStatus) {
    FilingStatus["PENDING"] = "pending";
    FilingStatus["PROCESSING"] = "processing";
    FilingStatus["SUBMITTED"] = "submitted";
    FilingStatus["ACCEPTED"] = "accepted";
    FilingStatus["REJECTED"] = "rejected";
    FilingStatus["FAILED"] = "failed";
    FilingStatus["COMPLETED"] = "completed";
    FilingStatus["APPROVED"] = "approved";
})(FilingStatus || (exports.FilingStatus = FilingStatus = {}));
/**
 * Document type options
 */
var DocumentType;
(function (DocumentType) {
    DocumentType["ARTICLES"] = "articles";
    DocumentType["OPERATING_AGREEMENT"] = "operating-agreement";
    DocumentType["BYLAWS"] = "bylaws";
    DocumentType["STOCK_CERTIFICATES"] = "stock-certificates";
    DocumentType["EIN_CONFIRMATION"] = "ein-confirmation";
    DocumentType["FORMATION_CERTIFICATE"] = "formation-certificate";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
/**
 * Document status types
 */
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "pending";
    DocumentStatus["GENERATING"] = "generating";
    DocumentStatus["READY"] = "ready";
    DocumentStatus["FAILED"] = "failed";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
/**
 * Agent error class
 */
class AgentError extends Error {
    constructor(message, code, retryable, statusCode, details) {
        super(message);
        this.name = 'AgentError';
        this.code = code;
        this.retryable = retryable;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, AgentError.prototype);
    }
}
exports.AgentError = AgentError;
/**
 * Default retry configuration
 */
exports.DEFAULT_RETRY_CONFIG = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableErrorCodes: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH']
};
/**
 * Helper function to check if name is available
 */
function isNameAvailable(response) {
    return response.status === 'available';
}
//# sourceMappingURL=types.js.map