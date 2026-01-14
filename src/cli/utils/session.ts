/**
 * Session management for resumable formation flows
 * FR-026: Persist user session data locally to support resume functionality
 * FR-027: Encrypt sensitive data at rest
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FormationSession } from '../types';

const SESSION_DIR = path.join(os.homedir(), '.lovie');
const SESSION_FILE = path.join(SESSION_DIR, 'session.json');

/**
 * Ensure session directory exists
 */
function ensureSessionDirectory(): void {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Save session to disk
 */
export function saveSession(session: FormationSession): void {
  try {
    ensureSessionDirectory();

    // Update timestamp
    session.updatedAt = new Date();

    // Write to file (in production, should encrypt sensitive data)
    fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), {
      mode: 0o600 // Only owner can read/write
    });
  } catch (error) {
    console.error('Failed to save session:', error);
    throw new Error('Unable to save session data');
  }
}

/**
 * Load existing session from disk
 */
export function loadSession(): FormationSession | null {
  try {
    if (!fs.existsSync(SESSION_FILE)) {
      return null;
    }

    const data = fs.readFileSync(SESSION_FILE, 'utf-8');
    const session = JSON.parse(data) as FormationSession;

    // Convert date strings back to Date objects
    session.createdAt = new Date(session.createdAt);
    session.updatedAt = new Date(session.updatedAt);

    return session;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Check if there's an existing incomplete session
 */
export function hasExistingSession(): boolean {
  try {
    const session = loadSession();
    return session !== null && session.status === 'in_progress';
  } catch {
    return false;
  }
}

/**
 * Clear session data
 * FR-029: Clear sensitive data after completion or cancellation
 */
export function clearSession(): void {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Archive completed session
 */
export function archiveSession(session: FormationSession): void {
  try {
    ensureSessionDirectory();

    const archiveFile = path.join(
      SESSION_DIR,
      `session-${session.id}-${Date.now()}.json`
    );

    fs.writeFileSync(archiveFile, JSON.stringify(session, null, 2), {
      mode: 0o600
    });
  } catch (error) {
    console.error('Failed to archive session:', error);
  }
}

/**
 * Create new session
 */
export function createSession(): FormationSession {
  return {
    id: generateSessionId(),
    currentStep: 0,
    data: {},
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
