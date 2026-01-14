import { v4 as uuidv4 } from 'uuid';
import { FormationSession, FormationStep, SessionStatus } from './types';

// In-memory session store (for development/testing)
// In production, this would use Redis or a database
const sessions = new Map<string, FormationSession>();

// Session TTL in milliseconds (24 hours)
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export class FormationSessionStore {
  // Create a new session
  async create(): Promise<FormationSession> {
    const now = new Date();
    const session: FormationSession = {
      sessionId: uuidv4(),
      status: SessionStatus.CREATED,
      currentStep: FormationStep.CREATED,
      shareholders: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    };

    sessions.set(session.sessionId, session);
    return session;
  }

  // Get session by ID
  async get(sessionId: string): Promise<FormationSession | null> {
    return sessions.get(sessionId) || null;
  }

  // Save/update session
  async save(session: FormationSession): Promise<void> {
    session.updatedAt = new Date().toISOString();
    sessions.set(session.sessionId, session);
  }

  // Delete session
  async delete(sessionId: string): Promise<boolean> {
    return sessions.delete(sessionId);
  }

  // List all sessions (for debugging)
  async list(): Promise<FormationSession[]> {
    return Array.from(sessions.values());
  }

  // Clean up expired sessions
  async cleanup(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of sessions) {
      if (new Date(session.expiresAt) < now) {
        sessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance
let storeInstance: FormationSessionStore | null = null;

export function getSessionStore(): FormationSessionStore {
  if (!storeInstance) {
    storeInstance = new FormationSessionStore();
  }
  return storeInstance;
}
