/**
 * SessionManager - Main class for session persistence and management
 * Implements FR-026, FR-027, FR-028, FR-029
 * Supports User Story 4: Resume Interrupted Formation
 */
import { SessionData, CompanyFormationData, SessionMetadata, StorageOptions, SessionBackup, SessionQuery } from './types';
export declare class SessionManager {
    private storageDir;
    private backupDir;
    private encryptionService;
    private options;
    private activeSessionId;
    constructor(options?: StorageOptions);
    /**
     * Initialize storage directories
     */
    initialize(): Promise<void>;
    /**
     * Create a new session (FR-028: Unique session ID generation)
     */
    createSession(metadata?: SessionMetadata): Promise<SessionData>;
    /**
     * Generate unique session ID (FR-028)
     */
    private generateSessionId;
    /**
     * Save session data with encryption (FR-026, FR-027)
     */
    saveSession(sessionData: SessionData): Promise<void>;
    /**
     * Load session data with decryption (FR-026)
     */
    loadSession(sessionId: string): Promise<SessionData | null>;
    /**
     * Update session data
     */
    updateSession(sessionId: string, updates: Partial<CompanyFormationData>, currentStep?: string): Promise<SessionData>;
    /**
     * Resume the most recent in-progress session (User Story 4, P3)
     */
    resumeSession(): Promise<SessionData | null>;
    /**
     * Complete a session and mark it as finished
     */
    completeSession(sessionId: string): Promise<void>;
    /**
     * Abandon a session (user cancelled)
     */
    abandonSession(sessionId: string): Promise<void>;
    /**
     * Clear sensitive data from session (FR-029)
     */
    clearSensitiveData(sessionId: string): Promise<void>;
    /**
     * Delete session completely
     */
    deleteSession(sessionId: string): Promise<void>;
    /**
     * List sessions with optional filtering
     */
    listSessions(query?: SessionQuery): Promise<SessionData[]>;
    /**
     * Create backup of session
     */
    createBackup(sessionData: SessionData): Promise<SessionBackup>;
    /**
     * Restore session from backup
     */
    restoreFromBackup(backupId: string): Promise<SessionData>;
    /**
     * Cleanup old sessions and backups (FR-029)
     */
    cleanupOldSessions(): Promise<number>;
    /**
     * Encrypt sensitive data in session (FR-027)
     */
    private encryptSensitiveData;
    /**
     * Decrypt sensitive data from session
     */
    private decryptSensitiveData;
    /**
     * Get session file path
     */
    private getSessionPath;
    /**
     * Save active session ID
     */
    private saveActiveSessionId;
    /**
     * Load active session ID
     */
    private loadActiveSession;
    /**
     * Clear active session ID
     */
    private clearActiveSessionId;
    /**
     * Get current active session ID
     */
    getActiveSessionId(): string | null;
    /**
     * Export session data for backend storage (FR-030)
     */
    exportSessionForBackend(sessionId: string): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=SessionManager.d.ts.map