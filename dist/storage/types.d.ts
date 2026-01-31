/**
 * Type definitions for session management system
 */
/**
 * Certificate session data from Feature 002
 */
export interface CertificateSessionData {
    certificateId: string;
    downloadUrl: string;
    s3Uri: string;
    expiresAt: string;
    approvedAt: string;
    metadata: {
        companyName: string;
        generatedAt: string;
        fileSize: number;
        fileHash: string;
    };
}
export interface SessionData {
    sessionId: string;
    createdAt: string;
    updatedAt: string;
    currentStep: string;
    status: SessionStatus;
    companyData?: CompanyFormationData;
    certificate?: CertificateSessionData;
    metadata?: SessionMetadata;
}
export declare enum SessionStatus {
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    ABANDONED = "abandoned",
    ARCHIVED = "archived"
}
export interface CompanyFormationData {
    companyName?: string;
    state?: string;
    companyType?: 'LLC' | 'C-Corp' | 'S-Corp';
    shareholders?: ShareholderInfo[];
    registeredAgent?: RegisteredAgentInfo;
    paymentInfo?: EncryptedPaymentInfo;
}
export interface ShareholderInfo {
    name: string;
    address: string;
    ownershipPercentage: number;
    ssn?: string;
    ein?: string;
}
export interface RegisteredAgentInfo {
    name: string;
    address: string;
    email: string;
    phone: string;
}
export interface EncryptedPaymentInfo {
    encryptedData: string;
    lastFour?: string;
    paymentMethod?: string;
}
export interface SessionMetadata {
    userAgent?: string;
    platform?: string;
    cliVersion?: string;
    lastActivity?: string;
    totalSteps?: number;
    completedSteps?: number;
}
export interface SessionBackup {
    backupId: string;
    sessionId: string;
    timestamp: string;
    data: SessionData;
    checksum: string;
}
export interface StorageOptions {
    storageDir?: string;
    encryptionKey?: string;
    backupEnabled?: boolean;
    backupRetentionDays?: number;
    autoCleanup?: boolean;
    cleanupAfterDays?: number;
}
export interface EncryptionResult {
    encryptedData: string;
    iv: string;
    authTag: string;
}
export interface DecryptionParams {
    encryptedData: string;
    iv: string;
    authTag: string;
}
export interface SessionQuery {
    status?: SessionStatus;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    limit?: number;
}
export declare class SessionError extends Error {
    code: string;
    details?: unknown | undefined;
    constructor(message: string, code: string, details?: unknown | undefined);
}
//# sourceMappingURL=types.d.ts.map