/**
 * Session manager for saving, loading, and resuming formation sessions
 */
import { FormationSession, Company } from '../types';
export declare class SessionManager {
    private readonly sessionDir;
    constructor();
    /**
     * Ensure session directory exists
     */
    private ensureSessionDir;
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Get session file path
     */
    private getSessionPath;
    /**
     * Create a new session
     */
    createSession(): FormationSession;
    /**
     * Save session to disk
     */
    saveSession(session: FormationSession): void;
    /**
     * Load session from disk
     */
    loadSession(sessionId: string): FormationSession | null;
    /**
     * Get the most recent in-progress session
     */
    getMostRecentSession(): FormationSession | null;
    /**
     * Update session data
     */
    updateSession(sessionId: string, updates: Partial<FormationSession>): boolean;
    /**
     * Update company data in session
     */
    updateCompanyData(sessionId: string, companyData: Partial<Company>): boolean;
    /**
     * Mark session as completed
     */
    completeSession(sessionId: string): boolean;
    /**
     * Mark session as failed
     */
    failSession(sessionId: string): boolean;
    /**
     * Mark session as abandoned
     */
    abandonSession(sessionId: string): boolean;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): boolean;
    /**
     * Clean up old sessions (older than 30 days)
     */
    cleanupOldSessions(): number;
    /**
     * Get session statistics
     */
    getSessionStats(): {
        total: number;
        inProgress: number;
        completed: number;
        failed: number;
    };
}
//# sourceMappingURL=sessionManager.d.ts.map