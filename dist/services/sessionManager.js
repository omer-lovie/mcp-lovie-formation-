"use strict";
/**
 * Session manager for saving, loading, and resuming formation sessions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class SessionManager {
    constructor() {
        // Store sessions in user's home directory
        this.sessionDir = path_1.default.join(os_1.default.homedir(), '.lovie', 'sessions');
        this.ensureSessionDir();
    }
    /**
     * Ensure session directory exists
     */
    ensureSessionDir() {
        if (!fs_1.default.existsSync(this.sessionDir)) {
            fs_1.default.mkdirSync(this.sessionDir, { recursive: true });
        }
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get session file path
     */
    getSessionPath(sessionId) {
        return path_1.default.join(this.sessionDir, `${sessionId}.json`);
    }
    /**
     * Create a new session
     */
    createSession() {
        const session = {
            sessionId: this.generateSessionId(),
            currentStep: 0,
            totalSteps: 7, // Total number of steps in the formation flow
            company: {},
            status: 'in-progress',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.saveSession(session);
        return session;
    }
    /**
     * Save session to disk
     */
    saveSession(session) {
        session.updatedAt = new Date();
        const sessionPath = this.getSessionPath(session.sessionId);
        // Create a serializable copy
        const serializable = {
            ...session,
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString()
        };
        fs_1.default.writeFileSync(sessionPath, JSON.stringify(serializable, null, 2), 'utf-8');
    }
    /**
     * Load session from disk
     */
    loadSession(sessionId) {
        const sessionPath = this.getSessionPath(sessionId);
        if (!fs_1.default.existsSync(sessionPath)) {
            return null;
        }
        try {
            const data = fs_1.default.readFileSync(sessionPath, 'utf-8');
            const parsed = JSON.parse(data);
            // Convert date strings back to Date objects
            return {
                ...parsed,
                createdAt: new Date(parsed.createdAt),
                updatedAt: new Date(parsed.updatedAt)
            };
        }
        catch (error) {
            console.error(`Error loading session ${sessionId}:`, error);
            return null;
        }
    }
    /**
     * Get the most recent in-progress session
     */
    getMostRecentSession() {
        try {
            const files = fs_1.default.readdirSync(this.sessionDir);
            const sessionFiles = files.filter(f => f.endsWith('.json'));
            if (sessionFiles.length === 0) {
                return null;
            }
            // Load all sessions and find the most recent in-progress one
            let mostRecent = null;
            let mostRecentTime = 0;
            for (const file of sessionFiles) {
                const sessionId = file.replace('.json', '');
                const session = this.loadSession(sessionId);
                if (session && session.status === 'in-progress') {
                    const time = session.updatedAt.getTime();
                    if (time > mostRecentTime) {
                        mostRecentTime = time;
                        mostRecent = session;
                    }
                }
            }
            return mostRecent;
        }
        catch (error) {
            console.error('Error getting most recent session:', error);
            return null;
        }
    }
    /**
     * Update session data
     */
    updateSession(sessionId, updates) {
        const session = this.loadSession(sessionId);
        if (!session) {
            return false;
        }
        const updatedSession = {
            ...session,
            ...updates,
            sessionId: session.sessionId, // Preserve original session ID
            createdAt: session.createdAt, // Preserve creation date
            updatedAt: new Date()
        };
        this.saveSession(updatedSession);
        return true;
    }
    /**
     * Update company data in session
     */
    updateCompanyData(sessionId, companyData) {
        const session = this.loadSession(sessionId);
        if (!session) {
            return false;
        }
        session.company = {
            ...session.company,
            ...companyData
        };
        this.saveSession(session);
        return true;
    }
    /**
     * Mark session as completed
     */
    completeSession(sessionId) {
        return this.updateSession(sessionId, { status: 'completed' });
    }
    /**
     * Mark session as failed
     */
    failSession(sessionId) {
        return this.updateSession(sessionId, { status: 'failed' });
    }
    /**
     * Mark session as abandoned
     */
    abandonSession(sessionId) {
        return this.updateSession(sessionId, { status: 'abandoned' });
    }
    /**
     * Delete a session
     */
    deleteSession(sessionId) {
        const sessionPath = this.getSessionPath(sessionId);
        if (!fs_1.default.existsSync(sessionPath)) {
            return false;
        }
        try {
            fs_1.default.unlinkSync(sessionPath);
            return true;
        }
        catch (error) {
            console.error(`Error deleting session ${sessionId}:`, error);
            return false;
        }
    }
    /**
     * Clean up old sessions (older than 30 days)
     */
    cleanupOldSessions() {
        try {
            const files = fs_1.default.readdirSync(this.sessionDir);
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
            let deletedCount = 0;
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                const sessionId = file.replace('.json', '');
                const session = this.loadSession(sessionId);
                if (session && session.updatedAt.getTime() < thirtyDaysAgo) {
                    if (this.deleteSession(sessionId)) {
                        deletedCount++;
                    }
                }
            }
            return deletedCount;
        }
        catch (error) {
            console.error('Error cleaning up old sessions:', error);
            return 0;
        }
    }
    /**
     * Get session statistics
     */
    getSessionStats() {
        try {
            const files = fs_1.default.readdirSync(this.sessionDir);
            const sessionFiles = files.filter(f => f.endsWith('.json'));
            let inProgress = 0;
            let completed = 0;
            let failed = 0;
            for (const file of sessionFiles) {
                const sessionId = file.replace('.json', '');
                const session = this.loadSession(sessionId);
                if (session) {
                    switch (session.status) {
                        case 'in-progress':
                            inProgress++;
                            break;
                        case 'completed':
                            completed++;
                            break;
                        case 'failed':
                        case 'abandoned':
                            failed++;
                            break;
                    }
                }
            }
            return {
                total: sessionFiles.length,
                inProgress,
                completed,
                failed
            };
        }
        catch (error) {
            console.error('Error getting session stats:', error);
            return { total: 0, inProgress: 0, completed: 0, failed: 0 };
        }
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=sessionManager.js.map