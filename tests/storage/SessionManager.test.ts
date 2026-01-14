/**
 * Tests for SessionManager
 * Tests FR-026, FR-027, FR-028, FR-029 and User Story 4
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { SessionManager } from '../../src/storage/SessionManager';
import {
  SessionStatus,
  CompanyFormationData,
  SessionData,
  SessionError,
} from '../../src/storage/types';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let testStorageDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testStorageDir = path.join(os.tmpdir(), `lovie-test-${Date.now()}`);
    sessionManager = new SessionManager({
      storageDir: testStorageDir,
      backupEnabled: true,
      autoCleanup: false,
    });
    await sessionManager.initialize();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Session Creation (FR-028)', () => {
    it('should create a new session with unique ID', async () => {
      const session = await sessionManager.createSession({
        cliVersion: '1.0.0',
      });

      expect(session.sessionId).toMatch(/^session-/);
      expect(session.status).toBe(SessionStatus.IN_PROGRESS);
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
      expect(session.metadata?.cliVersion).toBe('1.0.0');
    });

    it('should generate unique session IDs', async () => {
      const session1 = await sessionManager.createSession();
      const session2 = await sessionManager.createSession();

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should set active session on creation', async () => {
      const session = await sessionManager.createSession();
      expect(sessionManager.getActiveSessionId()).toBe(session.sessionId);
    });
  });

  describe('Session Persistence (FR-026)', () => {
    it('should save and load session data', async () => {
      const session = await sessionManager.createSession();
      const companyData: CompanyFormationData = {
        companyName: 'Test Company LLC',
        state: 'Delaware',
        companyType: 'LLC',
      };

      await sessionManager.updateSession(
        session.sessionId,
        companyData,
        'company-details'
      );

      const loadedSession = await sessionManager.loadSession(session.sessionId);

      expect(loadedSession).not.toBeNull();
      expect(loadedSession?.companyData?.companyName).toBe('Test Company LLC');
      expect(loadedSession?.companyData?.state).toBe('Delaware');
      expect(loadedSession?.currentStep).toBe('company-details');
    });

    it('should return null for non-existent session', async () => {
      const result = await sessionManager.loadSession('non-existent-session');
      expect(result).toBeNull();
    });

    it('should update session timestamps', async () => {
      const session = await sessionManager.createSession();
      const originalUpdate = session.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Updated Company',
      });

      const updated = await sessionManager.loadSession(session.sessionId);
      expect(updated?.updatedAt).not.toBe(originalUpdate);
    });
  });

  describe('Sensitive Data Encryption (FR-027)', () => {
    it('should encrypt SSN data', async () => {
      const session = await sessionManager.createSession();
      const companyData: CompanyFormationData = {
        companyName: 'Secure Company',
        shareholders: [
          {
            name: 'John Doe',
            address: '123 Main St',
            ownershipPercentage: 100,
            ssn: '123-45-6789',
          },
        ],
      };

      await sessionManager.updateSession(session.sessionId, companyData);

      // Read raw file to verify encryption
      const sessionPath = path.join(
        testStorageDir,
        `${session.sessionId}.json`
      );
      const rawContent = await fs.readFile(sessionPath, 'utf8');

      // SSN should not appear in plaintext
      expect(rawContent).not.toContain('123-45-6789');
      expect(rawContent).toContain('encryptedData');

      // But should decrypt correctly when loaded
      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded?.companyData?.shareholders?.[0].ssn).toBe('123456789'); // Normalized format
    });

    it('should encrypt payment information', async () => {
      const session = await sessionManager.createSession();
      const companyData: CompanyFormationData = {
        companyName: 'Secure Payment Company',
        paymentInfo: {
          encryptedData: JSON.stringify({
            cardNumber: '4111111111111111',
            cvv: '123',
            expiry: '12/25',
          }),
        },
      };

      await sessionManager.updateSession(session.sessionId, companyData);

      // Read raw file
      const sessionPath = path.join(
        testStorageDir,
        `${session.sessionId}.json`
      );
      const rawContent = await fs.readFile(sessionPath, 'utf8');

      // Card number should not appear in plaintext
      expect(rawContent).not.toContain('4111111111111111');
      expect(rawContent).not.toContain('123'); // CVV
    });

    it('should handle multiple shareholders with SSNs', async () => {
      const session = await sessionManager.createSession();
      const companyData: CompanyFormationData = {
        companyName: 'Multi Shareholder Corp',
        shareholders: [
          {
            name: 'Alice',
            address: '123 Main St',
            ownershipPercentage: 50,
            ssn: '111-22-3333',
          },
          {
            name: 'Bob',
            address: '456 Oak Ave',
            ownershipPercentage: 50,
            ssn: '444-55-6666',
          },
        ],
      };

      await sessionManager.updateSession(session.sessionId, companyData);

      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded?.companyData?.shareholders).toHaveLength(2);
      expect(loaded?.companyData?.shareholders?.[0].ssn).toBe('111223333');
      expect(loaded?.companyData?.shareholders?.[1].ssn).toBe('444556666');
    });
  });

  describe('Session Resume (User Story 4, P3)', () => {
    it('should resume most recent in-progress session', async () => {
      // Create multiple sessions
      const session1 = await sessionManager.createSession();
      await sessionManager.updateSession(session1.sessionId, {
        companyName: 'First Company',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const session2 = await sessionManager.createSession();
      await sessionManager.updateSession(session2.sessionId, {
        companyName: 'Second Company',
      });

      // Resume should get most recent
      const resumed = await sessionManager.resumeSession();
      expect(resumed?.sessionId).toBe(session2.sessionId);
      expect(resumed?.companyData?.companyName).toBe('Second Company');
    });

    it('should return null if no in-progress sessions exist', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.completeSession(session.sessionId);

      const resumed = await sessionManager.resumeSession();
      expect(resumed).toBeNull();
    });

    it('should not resume completed sessions', async () => {
      const session1 = await sessionManager.createSession();
      await sessionManager.updateSession(session1.sessionId, {
        companyName: 'Completed Company',
      });
      await sessionManager.completeSession(session1.sessionId);

      const session2 = await sessionManager.createSession();
      await sessionManager.updateSession(session2.sessionId, {
        companyName: 'Active Company',
      });

      const resumed = await sessionManager.resumeSession();
      expect(resumed?.sessionId).toBe(session2.sessionId);
    });

    it('should track active session across operations', async () => {
      const session = await sessionManager.createSession();

      expect(sessionManager.getActiveSessionId()).toBe(session.sessionId);

      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Test',
      });

      expect(sessionManager.getActiveSessionId()).toBe(session.sessionId);
    });
  });

  describe('Session Cleanup (FR-029)', () => {
    it('should clear sensitive data on completion', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Complete Company',
        shareholders: [
          {
            name: 'John',
            address: '123 Main',
            ownershipPercentage: 100,
            ssn: '123-45-6789',
          },
        ],
      });

      await sessionManager.completeSession(session.sessionId);

      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded?.status).toBe(SessionStatus.COMPLETED);
      expect(loaded?.companyData?.shareholders?.[0].ssn).toBeUndefined();
    });

    it('should clear active session on completion', async () => {
      const session = await sessionManager.createSession();
      expect(sessionManager.getActiveSessionId()).toBe(session.sessionId);

      await sessionManager.completeSession(session.sessionId);
      expect(sessionManager.getActiveSessionId()).toBeNull();
    });

    it('should delete session completely', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.deleteSession(session.sessionId);

      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded).toBeNull();
    });

    it('should cleanup old sessions', async () => {
      // Create old completed session
      const session1 = await sessionManager.createSession();
      await sessionManager.completeSession(session1.sessionId);

      // Manually update the file timestamp to be old
      const sessionPath = path.join(
        testStorageDir,
        `${session1.sessionId}.json`
      );
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago
      await fs.utimes(sessionPath, oldDate, oldDate);

      // Create recent session
      const session2 = await sessionManager.createSession();

      // Run cleanup with 90 day threshold
      const sessionManagerWithCleanup = new SessionManager({
        storageDir: testStorageDir,
        autoCleanup: true,
        cleanupAfterDays: 90,
      });

      const deletedCount = await sessionManagerWithCleanup.cleanupOldSessions();

      expect(deletedCount).toBeGreaterThan(0);

      // Old session should be deleted
      const loaded1 = await sessionManager.loadSession(session1.sessionId);
      expect(loaded1).toBeNull();

      // Recent session should remain
      const loaded2 = await sessionManager.loadSession(session2.sessionId);
      expect(loaded2).not.toBeNull();
    });
  });

  describe('Session Abandon', () => {
    it('should mark session as abandoned', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Abandoned Company',
      });

      await sessionManager.abandonSession(session.sessionId);

      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded?.status).toBe(SessionStatus.ABANDONED);
    });

    it('should clear active session on abandon', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.abandonSession(session.sessionId);

      expect(sessionManager.getActiveSessionId()).toBeNull();
    });
  });

  describe('Session Listing', () => {
    it('should list all sessions', async () => {
      await sessionManager.createSession();
      await sessionManager.createSession();
      await sessionManager.createSession();

      const sessions = await sessionManager.listSessions();
      expect(sessions).toHaveLength(3);
    });

    it('should filter sessions by status', async () => {
      const session1 = await sessionManager.createSession();
      const session2 = await sessionManager.createSession();
      await sessionManager.completeSession(session1.sessionId);

      const inProgress = await sessionManager.listSessions({
        status: SessionStatus.IN_PROGRESS,
      });
      const completed = await sessionManager.listSessions({
        status: SessionStatus.COMPLETED,
      });

      expect(inProgress).toHaveLength(1);
      expect(completed).toHaveLength(1);
      expect(inProgress[0].sessionId).toBe(session2.sessionId);
    });

    it('should limit results', async () => {
      await sessionManager.createSession();
      await sessionManager.createSession();
      await sessionManager.createSession();

      const sessions = await sessionManager.listSessions({ limit: 2 });
      expect(sessions).toHaveLength(2);
    });

    it('should sort by most recent first', async () => {
      const session1 = await sessionManager.createSession();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session2 = await sessionManager.createSession();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session3 = await sessionManager.createSession();

      const sessions = await sessionManager.listSessions();

      expect(sessions[0].sessionId).toBe(session3.sessionId);
      expect(sessions[1].sessionId).toBe(session2.sessionId);
      expect(sessions[2].sessionId).toBe(session1.sessionId);
    });
  });

  describe('Backup and Recovery', () => {
    it('should create backups automatically', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Backup Test Company',
      });

      // Check backup directory
      const backupDir = path.join(testStorageDir, 'backups');
      const backups = await fs.readdir(backupDir);

      expect(backups.length).toBeGreaterThan(0);
      expect(backups[0]).toContain(session.sessionId);
    });

    it('should restore from backup', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Original Data',
        state: 'Delaware',
      });

      // Get backup ID
      const backupDir = path.join(testStorageDir, 'backups');
      const backups = await fs.readdir(backupDir);
      const backupFile = backups[0];
      const backupId = backupFile.split('-').slice(1, 3).join('-');

      // Delete original
      await sessionManager.deleteSession(session.sessionId);

      // Restore from backup
      const restored = await sessionManager.restoreFromBackup(backupId);

      expect(restored.sessionId).toBe(session.sessionId);
      expect(restored.companyData?.companyName).toBe('Original Data');
      expect(restored.companyData?.state).toBe('Delaware');
    });

    it('should verify backup checksum', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Checksum Test',
      });

      // Get backup file and corrupt it
      const backupDir = path.join(testStorageDir, 'backups');
      const backups = await fs.readdir(backupDir);
      const backupPath = path.join(backupDir, backups[0]);

      const backupContent = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      backupContent.data.companyData.companyName = 'Corrupted Data';
      await fs.writeFile(backupPath, JSON.stringify(backupContent), 'utf8');

      const backupId = backups[0].split('-').slice(1, 3).join('-');

      // Should throw error due to checksum mismatch
      await expect(
        sessionManager.restoreFromBackup(backupId)
      ).rejects.toThrow('checksum mismatch');
    });
  });

  describe('Export for Backend (FR-030)', () => {
    it('should export session data for backend storage', async () => {
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Export Test Company',
        state: 'Delaware',
        companyType: 'LLC',
      });

      const exportData = await sessionManager.exportSessionForBackend(
        session.sessionId
      );

      expect(exportData.sessionId).toBe(session.sessionId);
      expect(exportData.companyData?.companyName).toBe('Export Test Company');
      expect(exportData.status).toBe(SessionStatus.IN_PROGRESS);
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        sessionManager.exportSessionForBackend('non-existent')
      ).rejects.toThrow('Session not found');
    });
  });

  describe('Error Handling', () => {
    it('should throw SessionError with code', async () => {
      try {
        await sessionManager.loadSession('invalid-path/../../../etc/passwd');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(SessionError);
        expect((error as SessionError).code).toBeDefined();
      }
    });

    it('should handle corrupted session files gracefully', async () => {
      const session = await sessionManager.createSession();
      const sessionPath = path.join(
        testStorageDir,
        `${session.sessionId}.json`
      );

      // Corrupt the file
      await fs.writeFile(sessionPath, 'invalid json {{{', 'utf8');

      await expect(
        sessionManager.loadSession(session.sessionId)
      ).rejects.toThrow();
    });
  });
});
