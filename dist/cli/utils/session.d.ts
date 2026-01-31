/**
 * Session management for resumable formation flows
 * FR-026: Persist user session data locally to support resume functionality
 * FR-027: Encrypt sensitive data at rest
 */
import { FormationSession } from '../types';
/**
 * Generate unique session ID
 */
export declare function generateSessionId(): string;
/**
 * Save session to disk
 */
export declare function saveSession(session: FormationSession): void;
/**
 * Load existing session from disk
 */
export declare function loadSession(): FormationSession | null;
/**
 * Check if there's an existing incomplete session
 */
export declare function hasExistingSession(): boolean;
/**
 * Clear session data
 * FR-029: Clear sensitive data after completion or cancellation
 */
export declare function clearSession(): void;
/**
 * Archive completed session
 */
export declare function archiveSession(session: FormationSession): void;
/**
 * Create new session
 */
export declare function createSession(): FormationSession;
//# sourceMappingURL=session.d.ts.map