/**
 * Shared types and interfaces for backend agent API clients
 * @module services/agents/types
 */
/**
 * US State codes for company formation
 */
export type USState = 'DE' | 'CA' | 'TX' | 'NY' | 'FL' | 'IL' | 'PA' | 'OH' | 'GA' | 'NC' | 'MI' | 'NJ' | 'VA' | 'WA' | 'AZ' | 'MA' | 'TN' | 'IN' | 'MO' | 'MD' | 'WI' | 'CO' | 'MN' | 'SC' | 'AL' | 'LA' | 'KY' | 'OR' | 'OK' | 'CT' | 'UT' | 'IA' | 'NV' | 'AR' | 'MS' | 'KS' | 'NM' | 'NE' | 'WV' | 'ID' | 'HI' | 'NH' | 'ME' | 'MT' | 'RI' | 'DE' | 'SD' | 'ND' | 'AK' | 'VT' | 'WY';
/**
 * Company type options
 */
export type CompanyType = 'LLC' | 'C-Corp' | 'S-Corp' | 'LP' | 'LLP' | 'GP' | 'Trust';
/**
 * Delaware entity type codes
 */
export type DelawareEntityType = 'C' | 'Y' | 'L' | 'P' | 'G' | 'T';
/**
 * Delaware entity type mapping with valid endings
 */
export interface DelawareEntityInfo {
    code: DelawareEntityType;
    name: string;
    requiresEnding: boolean;
    validEndings: string[];
    defaultEnding: string;
}
/**
 * Delaware entity type configurations
 */
export declare const DELAWARE_ENTITY_TYPES: Record<DelawareEntityType, DelawareEntityInfo>;
/**
 * Company type to Delaware entity type mapping
 */
export declare const COMPANY_TYPE_TO_DELAWARE: Record<CompanyType, DelawareEntityType>;
/**
 * Filing status types
 */
export declare enum FilingStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SUBMITTED = "submitted",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    FAILED = "failed",
    COMPLETED = "completed",
    APPROVED = "approved"
}
/**
 * Document type options
 */
export declare enum DocumentType {
    ARTICLES = "articles",
    OPERATING_AGREEMENT = "operating-agreement",
    BYLAWS = "bylaws",
    STOCK_CERTIFICATES = "stock-certificates",
    EIN_CONFIRMATION = "ein-confirmation",
    FORMATION_CERTIFICATE = "formation-certificate"
}
/**
 * Document status types
 */
export declare enum DocumentStatus {
    PENDING = "pending",
    GENERATING = "generating",
    READY = "ready",
    FAILED = "failed"
}
/**
 * Document generation request
 */
export interface DocumentGenerationRequest {
    sessionId: string;
    companyDetails: CompanyDetails;
    documentTypes: DocumentType[];
}
/**
 * Document generation response
 */
export interface DocumentGenerationResponse {
    jobId: string;
    documents: GeneratedDocument[];
    status: DocumentStatus;
}
/**
 * Generated document info
 */
export interface GeneratedDocument {
    type: DocumentType;
    url: string;
    filename: string;
    size: number;
}
/**
 * Document generation progress callback
 */
export interface DocumentGenerationProgress {
    stage: 'queued' | 'generating' | 'complete';
    message: string;
    progress?: number;
}
/**
 * Filing request
 */
export interface FilingRequest {
    sessionId: string;
    companyDetails: CompanyDetails;
    documents: GeneratedDocument[];
    expedited?: boolean;
}
/**
 * Filing response
 */
export interface FilingResponse {
    filingId: string;
    status: FilingStatus;
    confirmationNumber?: string;
    estimatedProcessingTime?: string;
}
/**
 * Filing progress callback
 */
export interface FilingProgress {
    stage: 'preparing' | 'submitting' | 'processing' | 'complete';
    message: string;
}
/**
 * Filing fees breakdown
 */
export interface FilingFees {
    stateFee: number;
    serviceFee: number;
    expediteFee?: number;
    total: number;
}
/**
 * Payment status types
 */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
/**
 * Base API response structure
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    timestamp: string;
    requestId: string;
}
/**
 * API error structure
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable: boolean;
}
/**
 * API client configuration
 */
export interface ClientConfig {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
    retryConfig: RetryConfig;
    headers?: Record<string, string>;
    healthCheckInterval?: number;
}
/**
 * Agent client configuration (alias for compatibility)
 */
export type AgentClientConfig = ClientConfig;
/**
 * Agent client options
 */
export interface AgentClientOptions {
    timeout?: number;
    retryConfig?: Partial<RetryConfig>;
    apiKey?: string;
    skipRetry?: boolean;
    signal?: AbortSignal;
    idempotencyKey?: string;
}
/**
 * Agent error class
 */
export declare class AgentError extends Error {
    code: string;
    retryable: boolean;
    statusCode?: number;
    details?: Record<string, unknown>;
    constructor(message: string, code: string, retryable: boolean, statusCode?: number, details?: Record<string, unknown>);
}
/**
 * Agent health response
 */
export interface AgentHealthResponse {
    healthy: boolean;
    version: string;
    uptime: number;
    lastCheck: string;
    status: AgentStatus;
}
/**
 * Agent status
 */
export type AgentStatus = 'online' | 'offline' | 'degraded' | 'unknown';
/**
 * Connection health
 */
export interface ConnectionHealth {
    agentName: string;
    status: AgentStatus;
    latency: number;
    lastSuccessfulRequest: string;
    lastSuccessfulCheck?: string;
    lastFailedCheck?: string;
    consecutiveFailures: number;
    errorMessage?: string;
}
/**
 * Default retry configuration
 */
export declare const DEFAULT_RETRY_CONFIG: RetryConfig;
/**
 * Extended retry configuration with retryable codes
 */
export interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableStatusCodes?: number[];
    retryableErrorCodes?: string[];
}
/**
 * Name availability check request (Delaware API format)
 *
 * Delaware entity type codes:
 * - C: Corporation (requires Inc., Corp., etc.)
 * - Y: LLC (requires LLC, L.L.C., etc.)
 * - L: Limited Partnership (requires LP, L.P., etc.)
 * - P: LLP (requires LLP, L.L.P., etc.)
 * - G: General Partnership (optional ending)
 * - T: Statutory Trust (optional ending)
 */
export interface NameCheckRequest {
    baseName: string;
    entityType: DelawareEntityType;
    entityEnding: string;
    requestId?: string;
}
/**
 * Name availability check response (Delaware API format)
 */
export interface NameCheckResponse {
    companyName: string;
    status: 'available' | 'taken' | 'error';
    checkedAt: string;
    responseTimeMs: number;
    rejectionReasons: string[] | null;
    captchaAttempts: number;
    baseName: string;
    entityType: string;
    entityEnding: string;
}
/**
 * High-level name check request (user-friendly format)
 */
export interface NameCheckRequestSimple {
    companyName: string;
    state: USState;
    companyType: CompanyType;
    requestId?: string;
}
/**
 * High-level name check response (user-friendly format)
 */
export interface NameCheckResponseSimple {
    available: boolean;
    companyName: string;
    state: USState;
    suggestions?: string[];
    similarNames?: string[];
    reason?: string;
    checkedAt: string;
}
/**
 * Helper function to check if name is available
 */
export declare function isNameAvailable(response: NameCheckResponse): boolean;
/**
 * Name check progress callback
 */
export interface NameCheckProgress {
    stage: 'checking' | 'validating' | 'complete';
    message: string;
}
/**
 * Shareholder/Member information
 */
export interface Shareholder {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: Address;
    ownershipPercentage: number;
    ssn?: string;
    ein?: string;
}
/**
 * Address structure
 */
export interface Address {
    street1: string;
    street2?: string;
    city: string;
    state: USState;
    zipCode: string;
    country?: string;
}
/**
 * Registered agent information
 */
export interface RegisteredAgent {
    name: string;
    address: Address;
    email: string;
    phone: string;
    isIndividual: boolean;
}
/**
 * Company formation details
 */
export interface CompanyDetails {
    name: string;
    state: USState;
    type: CompanyType;
    shareholders: Shareholder[];
    registeredAgent: RegisteredAgent;
    businessPurpose?: string;
    formationDate?: string;
}
/**
 * Document generation request
 */
export interface DocumentFillerRequest {
    sessionId: string;
    companyDetails: CompanyDetails;
    documentTypes: string[];
}
/**
 * Generated document metadata
 */
export interface GeneratedDocument {
    documentId: string;
    documentType: string;
    fileName: string;
    downloadUrl: string;
    fileSize: number;
    generatedAt: string;
}
/**
 * Document generation response
 */
export interface DocumentFillerResponse {
    sessionId: string;
    documents: GeneratedDocument[];
    status: 'completed' | 'partial' | 'failed';
    errors?: string[];
}
/**
 * Filing submission request
 */
export interface FilingRequest {
    sessionId: string;
    companyDetails: CompanyDetails;
    documents: GeneratedDocument[];
    expedited?: boolean;
}
/**
 * Filing submission response
 */
export interface FilingResponse {
    filingId: string;
    sessionId: string;
    status: FilingStatus;
    confirmationNumber?: string;
    filingDate?: string;
    estimatedProcessingDays?: number;
    trackingUrl?: string;
    message?: string;
}
/**
 * Filing status check response (from filing service)
 */
export interface FilingStatusResponse {
    filingId: string;
    status: FilingStatus;
    lastUpdated: string;
    confirmationNumber?: string;
    acceptedDate?: string;
    documents?: GeneratedDocument[];
    statusHistory: FilingStatusUpdate[];
}
/**
 * Filing status update history
 */
export interface FilingStatusUpdate {
    status: FilingStatus;
    timestamp: string;
    message?: string;
}
/**
 * Payment processing request
 */
export interface PaymentRequest {
    sessionId: string;
    amount: number;
    currency: string;
    description: string;
    paymentMethod: PaymentMethod;
    metadata?: Record<string, string>;
}
/**
 * Payment method details
 */
export interface PaymentMethod {
    type: 'card' | 'bank_account';
    cardNumber?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvv?: string;
    cardholderName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountHolderName?: string;
}
/**
 * Payment processing response
 */
export interface PaymentResponse {
    paymentId: string;
    sessionId: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    transactionId?: string;
    receiptUrl?: string;
    processedAt?: string;
    failureReason?: string;
}
/**
 * Cost breakdown structure
 */
export interface CostBreakdown {
    stateFee: number;
    serviceFee: number;
    expeditedFee?: number;
    total: number;
    currency: string;
}
/**
 * HTTP request options
 */
export interface RequestOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    data?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
    params?: Record<string, string | number | boolean>;
}
/**
 * Loading indicator callback type
 */
export type LoadingCallback = (isLoading: boolean, message?: string) => void;
/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number, message?: string) => void;
//# sourceMappingURL=types.d.ts.map