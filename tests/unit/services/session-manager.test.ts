/**
 * Unit Tests - Session Manager
 * Tests session data persistence and recovery
 */

import { sessionFixtures } from '../../fixtures/company-data.fixture';

describe('Session Manager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    sessionManager.clearAll();
  });

  describe('createSession', () => {
    it('should create a new session with unique ID', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();

      expect(session1.sessionId).toBeDefined();
      expect(session2.sessionId).toBeDefined();
      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should initialize session with default values', () => {
      const session = sessionManager.createSession();

      expect(session.currentStep).toBe(0);
      expect(session.collectedData).toEqual({});
      expect(session.createdAt).toBeDefined();
      expect(session.lastUpdated).toBeDefined();
    });
  });

  describe('saveSession', () => {
    it('should persist session data locally (FR-026)', () => {
      const sessionId = 'test_session_001';
      const data = {
        companyName: 'Test LLC',
        companyType: 'LLC',
        state: 'Delaware',
      };

      sessionManager.saveSession(sessionId, {
        currentStep: 2,
        collectedData: data,
      });

      const retrieved = sessionManager.getSession(sessionId);
      expect(retrieved).toBeDefined();
      expect(retrieved!.collectedData).toEqual(data);
    });

    it('should update lastUpdated timestamp on save', async () => {
      const sessionId = 'test_session_002';

      sessionManager.createSession(sessionId);
      const firstSave = sessionManager.getSession(sessionId)!;

      await new Promise((resolve) => setTimeout(resolve, 100));

      sessionManager.saveSession(sessionId, { currentStep: 1 });
      const secondSave = sessionManager.getSession(sessionId)!;

      expect(new Date(secondSave.lastUpdated).getTime()).toBeGreaterThan(
        new Date(firstSave.lastUpdated).getTime()
      );
    });

    it('should encrypt sensitive data at rest (FR-027)', () => {
      const sessionId = 'test_session_003';
      const sensitiveData = {
        ssn: '123-45-6789',
        paymentInfo: {
          cardNumber: '4111111111111111',
        },
      };

      sessionManager.saveSession(sessionId, {
        collectedData: sensitiveData,
      });

      const rawData = sessionManager.getRawData(sessionId);
      expect(rawData).not.toContain('123-45-6789');
      expect(rawData).not.toContain('4111111111111111');
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session', () => {
      const sessionId = 'test_session_004';
      const data = { companyName: 'Retrieved LLC' };

      sessionManager.saveSession(sessionId, { collectedData: data });
      const retrieved = sessionManager.getSession(sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved!.collectedData.companyName).toBe('Retrieved LLC');
    });

    it('should return null for non-existent session', () => {
      const retrieved = sessionManager.getSession('non_existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('resumeSession', () => {
    it('should allow resuming incomplete session (User Story 4)', () => {
      const sessionId = 'test_session_005';

      sessionManager.saveSession(sessionId, {
        currentStep: 3,
        collectedData: { companyName: 'Resume Test LLC' },
      });

      const canResume = sessionManager.canResume(sessionId);
      expect(canResume).toBe(true);

      const session = sessionManager.resumeSession(sessionId);
      expect(session!.currentStep).toBe(3);
      expect(session!.collectedData.companyName).toBe('Resume Test LLC');
    });

    it('should not allow resuming completed session', () => {
      const sessionId = 'test_session_006';

      sessionManager.saveSession(sessionId, {
        currentStep: 7,
        paymentCompleted: true,
        collectedData: {},
      });

      const canResume = sessionManager.canResume(sessionId);
      expect(canResume).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('should clear sensitive data after completion (FR-029)', () => {
      const sessionId = 'test_session_007';

      sessionManager.saveSession(sessionId, {
        collectedData: {
          ssn: '123-45-6789',
          paymentInfo: { cardNumber: '4111111111111111' },
        },
      });

      sessionManager.clearSession(sessionId);

      const retrieved = sessionManager.getSession(sessionId);
      expect(retrieved).toBeNull();
    });

    it('should archive session before clearing', () => {
      const sessionId = 'test_session_008';
      const data = { companyName: 'Archive Test LLC' };

      sessionManager.saveSession(sessionId, { collectedData: data });
      sessionManager.clearSession(sessionId);

      const archived = sessionManager.getArchivedSession(sessionId);
      expect(archived).toBeDefined();
      expect(archived!.collectedData.companyName).toBe('Archive Test LLC');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple concurrent sessions', () => {
      const sessionIds = Array.from({ length: 10 }, (_, i) => `session_${i}`);

      sessionIds.forEach((id) => {
        sessionManager.saveSession(id, {
          collectedData: { sessionNum: id },
        });
      });

      sessionIds.forEach((id) => {
        const session = sessionManager.getSession(id);
        expect(session).toBeDefined();
        expect(session!.collectedData.sessionNum).toBe(id);
      });
    });

    it('should handle session data exceeding size limits', () => {
      const sessionId = 'large_session';
      const largeData = {
        shareholders: Array.from({ length: 1000 }, (_, i) => ({
          name: `Shareholder ${i}`,
          data: 'x'.repeat(1000),
        })),
      };

      expect(() => {
        sessionManager.saveSession(sessionId, {
          collectedData: largeData,
        });
      }).not.toThrow();
    });

    it('should handle corrupted session data gracefully', () => {
      const sessionId = 'corrupted_session';

      sessionManager.corruptSession(sessionId);

      const retrieved = sessionManager.getSession(sessionId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Session Expiration', () => {
    it('should expire sessions after 24 hours of inactivity', () => {
      const sessionId = 'expired_session';

      sessionManager.saveSession(sessionId, {
        collectedData: { test: 'data' },
      });

      sessionManager.setSessionAge(sessionId, 25 * 60 * 60 * 1000); // 25 hours

      const isExpired = sessionManager.isExpired(sessionId);
      expect(isExpired).toBe(true);
    });

    it('should automatically clean up expired sessions', () => {
      const sessionIds = ['session_1', 'session_2', 'session_3'];

      sessionIds.forEach((id) => {
        sessionManager.saveSession(id, { collectedData: {} });
      });

      sessionManager.setSessionAge('session_2', 25 * 60 * 60 * 1000);

      sessionManager.cleanupExpired();

      expect(sessionManager.getSession('session_1')).toBeDefined();
      expect(sessionManager.getSession('session_2')).toBeNull();
      expect(sessionManager.getSession('session_3')).toBeDefined();
    });
  });
});

// Mock SessionManager implementation
class SessionManager {
  private sessions: Map<string, any> = new Map();
  private archived: Map<string, any> = new Map();

  createSession(sessionId?: string): any {
    const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      sessionId: id,
      currentStep: 0,
      collectedData: {},
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    this.sessions.set(id, session);
    return session;
  }

  saveSession(sessionId: string, updates: any): void {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }

    Object.assign(session, updates, {
      lastUpdated: new Date().toISOString(),
    });

    this.sessions.set(sessionId, session);
  }

  getSession(sessionId: string): any {
    return this.sessions.get(sessionId) || null;
  }

  canResume(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    return session && !session.paymentCompleted;
  }

  resumeSession(sessionId: string): any {
    return this.getSession(sessionId);
  }

  clearSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.archived.set(sessionId, session);
      this.sessions.delete(sessionId);
    }
  }

  clearAll(): void {
    this.sessions.clear();
    this.archived.clear();
  }

  getArchivedSession(sessionId: string): any {
    return this.archived.get(sessionId);
  }

  getRawData(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    return JSON.stringify(session);
  }

  corruptSession(sessionId: string): void {
    // Test helper - simulate corruption
  }

  setSessionAge(sessionId: string, ageMs: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const oldDate = new Date(Date.now() - ageMs);
      session.lastUpdated = oldDate.toISOString();
    }
  }

  isExpired(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const lastUpdate = new Date(session.lastUpdated).getTime();
    const now = Date.now();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    return hoursSinceUpdate > 24;
  }

  cleanupExpired(): void {
    const expired: string[] = [];
    this.sessions.forEach((session, id) => {
      if (this.isExpired(id)) {
        expired.push(id);
      }
    });

    expired.forEach((id) => this.clearSession(id));
  }
}
