/**
 * Session manager for saving, loading, and resuming formation sessions
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { FormationSession, Company } from '../types';

export class SessionManager {
  private readonly sessionDir: string;

  constructor() {
    // Store sessions in user's home directory
    this.sessionDir = path.join(os.homedir(), '.lovie', 'sessions');
    this.ensureSessionDir();
  }

  /**
   * Ensure session directory exists
   */
  private ensureSessionDir(): void {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session file path
   */
  private getSessionPath(sessionId: string): string {
    return path.join(this.sessionDir, `${sessionId}.json`);
  }

  /**
   * Create a new session
   */
  createSession(): FormationSession {
    const session: FormationSession = {
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
  saveSession(session: FormationSession): void {
    session.updatedAt = new Date();
    const sessionPath = this.getSessionPath(session.sessionId);

    // Create a serializable copy
    const serializable = {
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    };

    fs.writeFileSync(sessionPath, JSON.stringify(serializable, null, 2), 'utf-8');
  }

  /**
   * Load session from disk
   */
  loadSession(sessionId: string): FormationSession | null {
    const sessionPath = this.getSessionPath(sessionId);

    if (!fs.existsSync(sessionPath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(sessionPath, 'utf-8');
      const parsed = JSON.parse(data);

      // Convert date strings back to Date objects
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt)
      };
    } catch (error) {
      console.error(`Error loading session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Get the most recent in-progress session
   */
  getMostRecentSession(): FormationSession | null {
    try {
      const files = fs.readdirSync(this.sessionDir);
      const sessionFiles = files.filter(f => f.endsWith('.json'));

      if (sessionFiles.length === 0) {
        return null;
      }

      // Load all sessions and find the most recent in-progress one
      let mostRecent: FormationSession | null = null;
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
    } catch (error) {
      console.error('Error getting most recent session:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  updateSession(sessionId: string, updates: Partial<FormationSession>): boolean {
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
  updateCompanyData(sessionId: string, companyData: Partial<Company>): boolean {
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
  completeSession(sessionId: string): boolean {
    return this.updateSession(sessionId, { status: 'completed' });
  }

  /**
   * Mark session as failed
   */
  failSession(sessionId: string): boolean {
    return this.updateSession(sessionId, { status: 'failed' });
  }

  /**
   * Mark session as abandoned
   */
  abandonSession(sessionId: string): boolean {
    return this.updateSession(sessionId, { status: 'abandoned' });
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    const sessionPath = this.getSessionPath(sessionId);

    if (!fs.existsSync(sessionPath)) {
      return false;
    }

    try {
      fs.unlinkSync(sessionPath);
      return true;
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Clean up old sessions (older than 30 days)
   */
  cleanupOldSessions(): number {
    try {
      const files = fs.readdirSync(this.sessionDir);
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const sessionId = file.replace('.json', '');
        const session = this.loadSession(sessionId);

        if (session && session.updatedAt.getTime() < thirtyDaysAgo) {
          if (this.deleteSession(sessionId)) {
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): { total: number; inProgress: number; completed: number; failed: number } {
    try {
      const files = fs.readdirSync(this.sessionDir);
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
    } catch (error) {
      console.error('Error getting session stats:', error);
      return { total: 0, inProgress: 0, completed: 0, failed: 0 };
    }
  }
}
