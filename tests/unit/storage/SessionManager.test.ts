/**
 * Unit tests for SessionManager
 * Tests FR-026, FR-027, FR-028, FR-029 (Session persistence, encryption, cleanup)
 * Tests User Story 4: Resume Interrupted Formation (P3)
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { SessionManager } from '../../../src/storage/SessionManager';
import {
  SessionData,
  SessionStatus,
  StorageOptions,
} from '../../../src/storage/types';
import {
  mockSessionData,
  mockCompanyFormationData,
  mockShareholder,
  mockPaymentInfo,
} from '../../fixtures/mockData';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let testStorageDir: string;

  beforeEach(async () => {
    // Create unique test directory for each test
    testStorageDir = path.join(os.tmpdir(), `lovie-test-${Date.now()}`);

    const options: StorageOptions = {
      storageDir: testStorageDir,
      backupEnabled: true,
      autoCleanup: false, // Disable auto-cleanup for tests
    };

    sessionManager = new SessionManager(options);
    await sessionManager.initialize();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialize', () => {
    it('should create storage directories', async () => {
      // Assert
      const mainDirExists = await fs
        .access(testStorageDir)
        .then(() => true)
        .catch(() => false);
      const backupDirExists = await fs
        .access(path.join(testStorageDir, 'backups'))
        .then(() => true)
        .catch(() => false);

      expect(mainDirExists).toBe(true);
      expect(backupDirExists).toBe(true);
    });
  });

  describe('createSession (FR-028)', () => {
    it('should create new session with unique ID', async () => {
      // Act
      const session = await sessionManager.createSession();

      // Assert
      expect(session.sessionId).toBeDefined();
      expect(session.sessionId).toContain('session-');
      expect(session.status).toBe(SessionStatus.IN_PROGRESS);
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });

    it('should generate unique session IDs', async () => {
      // Act
      const session1 = await sessionManager.createSession();
      const session2 = await sessionManager.createSession();

      // Assert
      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should include platform metadata', async () => {
      // Act
      const session = await sessionManager.createSession();

      // Assert
      expect(session.metadata?.platform).toBeDefined();
      expect(session.metadata?.lastActivity).toBeDefined();
    });

    it('should set as active session', async () => {
      // Act
      const session = await sessionManager.createSession();

      // Assert
      expect(sessionManager.getActiveSessionId()).toBe(session.sessionId);
    });
  });

  describe('saveSession and loadSession (FR-026, FR-027)', () => {
    it('should save and load session data', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      session.companyData = mockCompanyFormationData;

      // Act
      await sessionManager.saveSession(session);
      const loaded = await sessionManager.loadSession(session.sessionId);

      // Assert
      expect(loaded).toBeDefined();
      expect(loaded?.sessionId).toBe(session.sessionId);
      expect(loaded?.companyData?.companyName).toBe('Test Company LLC');
    });

    it('should encrypt sensitive data (SSN)', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      session.companyData = {
        ...mockCompanyFormationData,
        shareholders: [mockShareholder],
      };

      // Act
      await sessionManager.saveSession(session);

      // Read raw file to check encryption
      const sessionPath = path.join(testStorageDir, `${session.sessionId}.json`);
      const rawContent = await fs.readFile(sessionPath, 'utf8');

      // Assert
      expect(rawContent).not.toContain('123-45-6789'); // SSN should be encrypted
      expect(rawContent).toContain('encryptedData'); // Should have encryption markers

      // Verify decryption works
      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded?.companyData?.shareholders?.[0]?.ssn).toBe('123-45-6789');
    });

    it('should encrypt payment information', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      session.companyData = {
        ...mockCompanyFormationData,
        paymentInfo: mockPaymentInfo as any,
      };

      // Act
      await sessionManager.saveSession(session);

      // Read raw file
      const sessionPath = path.join(testStorageDir, `${session.sessionId}.json`);
      const rawContent = await fs.readFile(sessionPath, 'utf8');

      // Assert
      expect(rawContent).not.toContain('4111111111111111'); // Card should be encrypted

      // Verify decryption
      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded?.companyData?.paymentInfo).toBeDefined();
    });

    it('should return null for non-existent session', async () => {
      // Act
      const loaded = await sessionManager.loadSession('non-existent-session');

      // Assert
      expect(loaded).toBeNull();
    });

    it('should update timestamp on save', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      const originalUpdatedAt = session.updatedAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      await sessionManager.saveSession(session);
      const loaded = await sessionManager.loadSession(session.sessionId);

      // Assert
      expect(loaded?.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('updateSession', () => {
    it('should update company data', async () => {
      // Arrange
      const session = await sessionManager.createSession();

      // Act
      const updated = await sessionManager.updateSession(
        session.sessionId,
        { companyName: 'Updated Company LLC' },
        'company-info'
      );

      // Assert
      expect(updated.companyData?.companyName).toBe('Updated Company LLC');
      expect(updated.currentStep).toBe('company-info');
    });

    it('should merge updates with existing data', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      await sessionManager.updateSession(session.sessionId, {
        companyName: 'Test Company',
      });

      // Act
      const updated = await sessionManager.updateSession(session.sessionId, {
        companyType: 'LLC',
      });

      // Assert
      expect(updated.companyData?.companyName).toBe('Test Company');
      expect(updated.companyData?.companyType).toBe('LLC');
    });
  });

  describe('resumeSession (User Story 4, P3)', () => {
    it('should resume most recent in-progress session', async () => {
      // Arrange
      const session1 = await sessionManager.createSession();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session2 = await sessionManager.createSession();

      // Act
      const resumed = await sessionManager.resumeSession();

      // Assert
      expect(resumed?.sessionId).toBe(session2.sessionId);
    });

    it('should return null if no in-progress sessions', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      await sessionManager.completeSession(session.sessionId);

      // Act
      const resumed = await sessionManager.resumeSession();

      // Assert
      expect(resumed).toBeNull();
    });

    it('should set resumed session as active', async () => {
      // Arrange
      const session = await sessionManager.createSession();

      // Clear active session
      const activeFile = path.join(testStorageDir, 'active_session.json');
      await fs.unlink(activeFile).catch(() => {});

      // Act
      await sessionManager.resumeSession();

      // Assert
      expect(sessionManager.getActiveSessionId()).toBe(session.sessionId);
    });
  });

  describe('completeSession', () => {
    it('should mark session as completed', async () => {
      // Arrange
      const session = await sessionManager.createSession();

      // Act
      await sessionManager.completeSession(session.sessionId);
      const loaded = await sessionManager.loadSession(session.sessionId);

      // Assert
      expect(loaded?.status).toBe(SessionStatus.COMPLETED);
    });

    it('should clear active session', async () => {
      // Arrange
      const session = await sessionManager.createSession();

      // Act
      await sessionManager.completeSession(session.sessionId);

      // Assert
      expect(sessionManager.getActiveSessionId()).toBeNull();
    });

    it('should clear sensitive data (FR-029)', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      session.companyData = {
        ...mockCompanyFormationData,
        shareholders: [mockShareholder],
        paymentInfo: mockPaymentInfo as any,
      };
      await sessionManager.saveSession(session);

      // Act
      await sessionManager.completeSession(session.sessionId);
      const loaded = await sessionManager.loadSession(session.sessionId);

      // Assert
      expect(loaded?.companyData?.shareholders?.[0]?.ssn).toBeUndefined();
      expect(loaded?.companyData?.paymentInfo).toBeUndefined();
    });
  });

  describe('abandonSession', () => {
    it('should mark session as abandoned', async () => {
      // Arrange
      const session = await sessionManager.createSession();

      // Act
      await sessionManager.abandonSession(session.sessionId);
      const loaded = await sessionManager.loadSession(session.sessionId);

      // Assert
      expect(loaded?.status).toBe(SessionStatus.ABANDONED);
    });
  });

  describe('listSessions', () => {
    it('should list all sessions', async () => {
      // Arrange
      await sessionManager.createSession();
      await sessionManager.createSession();
      await sessionManager.createSession();

      // Act
      const sessions = await sessionManager.listSessions();

      // Assert
      expect(sessions).toHaveLength(3);
    });

    it('should filter by status', async () => {
      // Arrange
      const session1 = await sessionManager.createSession();
      const session2 = await sessionManager.createSession();
      await sessionManager.completeSession(session1.sessionId);

      // Act
      const inProgress = await sessionManager.listSessions({
        status: SessionStatus.IN_PROGRESS,
      });
      const completed = await sessionManager.listSessions({
        status: SessionStatus.COMPLETED,
      });

      // Assert
      expect(inProgress).toHaveLength(1);
      expect(completed).toHaveLength(1);
    });

    it('should limit results', async () => {
      // Arrange
      await sessionManager.createSession();
      await sessionManager.createSession();
      await sessionManager.createSession();

      // Act
      const sessions = await sessionManager.listSessions({ limit: 2 });

      // Assert
      expect(sessions).toHaveLength(2);
    });

    it('should sort by most recent first', async () => {
      // Arrange
      const session1 = await sessionManager.createSession();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session2 = await sessionManager.createSession();

      // Act
      const sessions = await sessionManager.listSessions();

      // Assert
      expect(sessions[0].sessionId).toBe(session2.sessionId);
      expect(sessions[1].sessionId).toBe(session1.sessionId);
    });
  });

  describe('backup and restore', () => {
    it('should create backup on save', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      session.companyData = mockCompanyFormationData;

      // Act
      await sessionManager.saveSession(session);

      // Assert
      const backupDir = path.join(testStorageDir, 'backups');
      const backups = await fs.readdir(backupDir);
      expect(backups.length).toBeGreaterThan(0);
    });

    it('should restore from backup', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      session.companyData = mockCompanyFormationData;
      await sessionManager.saveSession(session);

      // Get backup ID
      const backupDir = path.join(testStorageDir, 'backups');
      const backups = await fs.readdir(backupDir);
      const backupFile = backups[0];
      const backupContent = JSON.parse(
        await fs.readFile(path.join(backupDir, backupFile), 'utf8')
      );

      // Delete original session
      await sessionManager.deleteSession(session.sessionId);

      // Act
      const restored = await sessionManager.restoreFromBackup(
        backupContent.backupId
      );

      // Assert
      expect(restored.sessionId).toBe(session.sessionId);
      expect(restored.companyData?.companyName).toBe('Test Company LLC');
    });
  });

  describe('cleanupOldSessions (FR-029)', () => {
    it('should cleanup old completed sessions', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      await sessionManager.completeSession(session.sessionId);

      // Manually set old date
      const sessionPath = path.join(testStorageDir, `${session.sessionId}.json`);
      const sessionContent = JSON.parse(await fs.readFile(sessionPath, 'utf8'));
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      sessionContent.updatedAt = oldDate.toISOString();
      await fs.writeFile(sessionPath, JSON.stringify(sessionContent));

      // Act
      const deleted = await sessionManager.cleanupOldSessions();

      // Assert
      expect(deleted).toBeGreaterThan(0);
      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded).toBeNull();
    });

    it('should not cleanup recent sessions', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      await sessionManager.completeSession(session.sessionId);

      // Act
      await sessionManager.cleanupOldSessions();

      // Assert
      const loaded = await sessionManager.loadSession(session.sessionId);
      expect(loaded).not.toBeNull();
    });
  });

  describe('exportSessionForBackend (FR-030)', () => {
    it('should export session for backend storage', async () => {
      // Arrange
      const session = await sessionManager.createSession();
      session.companyData = mockCompanyFormationData;
      await sessionManager.saveSession(session);

      // Act
      const exported = await sessionManager.exportSessionForBackend(
        session.sessionId
      );

      // Assert
      expect(exported.sessionId).toBe(session.sessionId);
      expect(exported.companyData).toBeDefined();
      expect(exported.status).toBe(SessionStatus.IN_PROGRESS);
    });
  });
});
