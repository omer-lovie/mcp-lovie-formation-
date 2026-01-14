/**
 * SessionManager - Main class for session persistence and management
 * Implements FR-026, FR-027, FR-028, FR-029
 * Supports User Story 4: Resume Interrupted Formation
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import {
  SessionData,
  SessionStatus,
  CompanyFormationData,
  SessionMetadata,
  StorageOptions,
  SessionBackup,
  SessionQuery,
  SessionError,
  ShareholderInfo,
  EncryptedPaymentInfo,
} from './types';
import { EncryptionService } from './encryption';

const DEFAULT_STORAGE_DIR = path.join(os.homedir(), '.lovie', 'sessions');
const BACKUP_DIR_NAME = 'backups';
const ACTIVE_SESSION_FILE = 'active_session.json';

export class SessionManager {
  private storageDir: string;
  private backupDir: string;
  private encryptionService: EncryptionService;
  private options: Required<StorageOptions>;
  private activeSessionId: string | null = null;

  constructor(options: StorageOptions = {}) {
    this.options = {
      storageDir: options.storageDir || DEFAULT_STORAGE_DIR,
      encryptionKey: options.encryptionKey || '',
      backupEnabled: options.backupEnabled ?? true,
      backupRetentionDays: options.backupRetentionDays ?? 30,
      autoCleanup: options.autoCleanup ?? true,
      cleanupAfterDays: options.cleanupAfterDays ?? 90,
    };

    this.storageDir = this.options.storageDir;
    this.backupDir = path.join(this.storageDir, BACKUP_DIR_NAME);
    this.encryptionService = new EncryptionService(this.options.encryptionKey);
  }

  /**
   * Initialize storage directories
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      if (this.options.backupEnabled) {
        await fs.mkdir(this.backupDir, { recursive: true });
      }

      // Load active session if exists
      await this.loadActiveSession();

      // Run cleanup if enabled
      if (this.options.autoCleanup) {
        await this.cleanupOldSessions();
      }
    } catch (error) {
      throw new SessionError(
        'Failed to initialize session storage',
        'INIT_ERROR',
        error
      );
    }
  }

  /**
   * Create a new session (FR-028: Unique session ID generation)
   */
  async createSession(metadata?: SessionMetadata): Promise<SessionData> {
    try {
      const sessionId = this.generateSessionId();
      const now = new Date().toISOString();

      const sessionData: SessionData = {
        sessionId,
        createdAt: now,
        updatedAt: now,
        currentStep: 'start',
        status: SessionStatus.IN_PROGRESS,
        metadata: {
          ...metadata,
          platform: os.platform(),
          lastActivity: now,
        },
      };

      await this.saveSession(sessionData);
      this.activeSessionId = sessionId;
      await this.saveActiveSessionId(sessionId);

      return sessionData;
    } catch (error) {
      throw new SessionError(
        'Failed to create session',
        'CREATE_ERROR',
        error
      );
    }
  }

  /**
   * Generate unique session ID (FR-028)
   */
  private generateSessionId(): string {
    const uuid = uuidv4();
    const timestamp = Date.now().toString(36);
    return `session-${timestamp}-${uuid}`;
  }

  /**
   * Save session data with encryption (FR-026, FR-027)
   */
  async saveSession(sessionData: SessionData): Promise<void> {
    try {
      // Encrypt sensitive data before saving
      const encryptedSession = await this.encryptSensitiveData(sessionData);

      // Update timestamp
      encryptedSession.updatedAt = new Date().toISOString();
      if (encryptedSession.metadata) {
        encryptedSession.metadata.lastActivity = encryptedSession.updatedAt;
      }

      // Save to file
      const sessionPath = this.getSessionPath(sessionData.sessionId);
      await fs.writeFile(
        sessionPath,
        JSON.stringify(encryptedSession, null, 2),
        'utf8'
      );

      // Create backup if enabled
      if (this.options.backupEnabled) {
        await this.createBackup(encryptedSession);
      }
    } catch (error) {
      throw new SessionError(
        'Failed to save session',
        'SAVE_ERROR',
        error
      );
    }
  }

  /**
   * Load session data with decryption (FR-026)
   */
  async loadSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionPath = this.getSessionPath(sessionId);

      // Check if file exists
      try {
        await fs.access(sessionPath);
      } catch {
        return null;
      }

      // Read and parse session data
      const fileContent = await fs.readFile(sessionPath, 'utf8');
      const encryptedSession = JSON.parse(fileContent) as SessionData;

      // Decrypt sensitive data
      const sessionData = await this.decryptSensitiveData(encryptedSession);

      return sessionData;
    } catch (error) {
      throw new SessionError(
        'Failed to load session',
        'LOAD_ERROR',
        error
      );
    }
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<CompanyFormationData>,
    currentStep?: string
  ): Promise<SessionData> {
    try {
      const session = await this.loadSession(sessionId);
      if (!session) {
        throw new SessionError(
          'Session not found',
          'SESSION_NOT_FOUND'
        );
      }

      // Update company data
      session.companyData = {
        ...session.companyData,
        ...updates,
      };

      // Update current step if provided
      if (currentStep) {
        session.currentStep = currentStep;
      }

      await this.saveSession(session);
      return session;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        'Failed to update session',
        'UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Resume the most recent in-progress session (User Story 4, P3)
   */
  async resumeSession(): Promise<SessionData | null> {
    try {
      // Try to load active session
      if (this.activeSessionId) {
        const session = await this.loadSession(this.activeSessionId);
        if (session && session.status === SessionStatus.IN_PROGRESS) {
          return session;
        }
      }

      // Find most recent in-progress session
      const sessions = await this.listSessions({
        status: SessionStatus.IN_PROGRESS,
        limit: 1,
      });

      if (sessions.length > 0) {
        this.activeSessionId = sessions[0].sessionId;
        await this.saveActiveSessionId(sessions[0].sessionId);
        return sessions[0];
      }

      return null;
    } catch (error) {
      throw new SessionError(
        'Failed to resume session',
        'RESUME_ERROR',
        error
      );
    }
  }

  /**
   * Complete a session and mark it as finished
   */
  async completeSession(sessionId: string): Promise<void> {
    try {
      const session = await this.loadSession(sessionId);
      if (!session) {
        throw new SessionError(
          'Session not found',
          'SESSION_NOT_FOUND'
        );
      }

      session.status = SessionStatus.COMPLETED;
      await this.saveSession(session);

      // Clear active session if this was it
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
        await this.clearActiveSessionId();
      }

      // Schedule cleanup of sensitive data after completion
      await this.clearSensitiveData(sessionId);
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        'Failed to complete session',
        'COMPLETE_ERROR',
        error
      );
    }
  }

  /**
   * Abandon a session (user cancelled)
   */
  async abandonSession(sessionId: string): Promise<void> {
    try {
      const session = await this.loadSession(sessionId);
      if (!session) {
        throw new SessionError(
          'Session not found',
          'SESSION_NOT_FOUND'
        );
      }

      session.status = SessionStatus.ABANDONED;
      await this.saveSession(session);

      // Clear active session if this was it
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
        await this.clearActiveSessionId();
      }
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        'Failed to abandon session',
        'ABANDON_ERROR',
        error
      );
    }
  }

  /**
   * Clear sensitive data from session (FR-029)
   */
  async clearSensitiveData(sessionId: string): Promise<void> {
    try {
      const session = await this.loadSession(sessionId);
      if (!session) {
        return;
      }

      // Remove sensitive fields
      if (session.companyData) {
        if (session.companyData.shareholders) {
          session.companyData.shareholders = session.companyData.shareholders.map(
            (sh) => ({
              ...sh,
              ssn: undefined,
            })
          );
        }
        session.companyData.paymentInfo = undefined;
      }

      await this.saveSession(session);
    } catch (error) {
      throw new SessionError(
        'Failed to clear sensitive data',
        'CLEAR_SENSITIVE_ERROR',
        error
      );
    }
  }

  /**
   * Delete session completely
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      await fs.unlink(sessionPath);

      // Clear active session if this was it
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
        await this.clearActiveSessionId();
      }
    } catch (error) {
      throw new SessionError(
        'Failed to delete session',
        'DELETE_ERROR',
        error
      );
    }
  }

  /**
   * List sessions with optional filtering
   */
  async listSessions(query?: SessionQuery): Promise<SessionData[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      const sessionFiles = files.filter(
        (f) => f.startsWith('session-') && f.endsWith('.json')
      );

      const sessions: SessionData[] = [];

      for (const file of sessionFiles) {
        const sessionId = path.basename(file, '.json');
        const session = await this.loadSession(sessionId);

        if (!session) continue;

        // Apply filters
        if (query) {
          if (query.status && session.status !== query.status) continue;
          if (query.createdAfter && new Date(session.createdAt) < query.createdAfter) continue;
          if (query.createdBefore && new Date(session.createdAt) > query.createdBefore) continue;
          if (query.updatedAfter && new Date(session.updatedAt) < query.updatedAfter) continue;
        }

        sessions.push(session);
      }

      // Sort by updatedAt (most recent first)
      sessions.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // Apply limit
      if (query?.limit) {
        return sessions.slice(0, query.limit);
      }

      return sessions;
    } catch (error) {
      throw new SessionError(
        'Failed to list sessions',
        'LIST_ERROR',
        error
      );
    }
  }

  /**
   * Create backup of session
   */
  async createBackup(sessionData: SessionData): Promise<SessionBackup> {
    try {
      const backupId = `backup-${Date.now()}-${uuidv4()}`;
      const dataString = JSON.stringify(sessionData);
      const checksum = this.encryptionService.createChecksum(dataString);

      const backup: SessionBackup = {
        backupId,
        sessionId: sessionData.sessionId,
        timestamp: new Date().toISOString(),
        data: sessionData,
        checksum,
      };

      const backupPath = path.join(
        this.backupDir,
        `${sessionData.sessionId}-${backupId}.json`
      );

      await fs.writeFile(
        backupPath,
        JSON.stringify(backup, null, 2),
        'utf8'
      );

      return backup;
    } catch (error) {
      throw new SessionError(
        'Failed to create backup',
        'BACKUP_ERROR',
        error
      );
    }
  }

  /**
   * Restore session from backup
   */
  async restoreFromBackup(backupId: string): Promise<SessionData> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFile = files.find((f) => f.includes(backupId));

      if (!backupFile) {
        throw new SessionError(
          'Backup not found',
          'BACKUP_NOT_FOUND'
        );
      }

      const backupPath = path.join(this.backupDir, backupFile);
      const backupContent = await fs.readFile(backupPath, 'utf8');
      const backup = JSON.parse(backupContent) as SessionBackup;

      // Verify checksum
      const dataString = JSON.stringify(backup.data);
      if (!this.encryptionService.verifyChecksum(dataString, backup.checksum)) {
        throw new SessionError(
          'Backup data corrupted - checksum mismatch',
          'BACKUP_CORRUPTED'
        );
      }

      // Save restored session
      await this.saveSession(backup.data);

      return backup.data;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(
        'Failed to restore from backup',
        'RESTORE_ERROR',
        error
      );
    }
  }

  /**
   * Cleanup old sessions and backups (FR-029)
   */
  async cleanupOldSessions(): Promise<number> {
    try {
      let deletedCount = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.options.cleanupAfterDays);

      // Cleanup old completed/abandoned sessions
      const sessions = await this.listSessions();

      for (const session of sessions) {
        const sessionDate = new Date(session.updatedAt);

        if (
          sessionDate < cutoffDate &&
          (session.status === SessionStatus.COMPLETED ||
            session.status === SessionStatus.ABANDONED)
        ) {
          await this.deleteSession(session.sessionId);
          deletedCount++;
        }
      }

      // Cleanup old backups
      if (this.options.backupEnabled) {
        const backupCutoff = new Date();
        backupCutoff.setDate(
          backupCutoff.getDate() - this.options.backupRetentionDays
        );

        const backupFiles = await fs.readdir(this.backupDir);

        for (const file of backupFiles) {
          const backupPath = path.join(this.backupDir, file);
          const stats = await fs.stat(backupPath);

          if (stats.mtime < backupCutoff) {
            await fs.unlink(backupPath);
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      throw new SessionError(
        'Failed to cleanup old sessions',
        'CLEANUP_ERROR',
        error
      );
    }
  }

  /**
   * Encrypt sensitive data in session (FR-027)
   */
  private async encryptSensitiveData(
    sessionData: SessionData
  ): Promise<SessionData> {
    const clonedData = JSON.parse(JSON.stringify(sessionData)) as SessionData;

    if (clonedData.companyData) {
      // Encrypt shareholder SSNs
      if (clonedData.companyData.shareholders) {
        clonedData.companyData.shareholders = clonedData.companyData.shareholders.map(
          (shareholder) => {
            if (shareholder.ssn) {
              const encrypted = this.encryptionService.encryptSSN(
                shareholder.ssn
              );
              return {
                ...shareholder,
                ssn: JSON.stringify(encrypted),
              };
            }
            return shareholder;
          }
        );
      }

      // Encrypt payment info
      if (clonedData.companyData.paymentInfo) {
        const encrypted = this.encryptionService.encryptObject(
          clonedData.companyData.paymentInfo
        );
        clonedData.companyData.paymentInfo = {
          encryptedData: JSON.stringify(encrypted),
        } as EncryptedPaymentInfo;
      }
    }

    return clonedData;
  }

  /**
   * Decrypt sensitive data from session
   */
  private async decryptSensitiveData(
    sessionData: SessionData
  ): Promise<SessionData> {
    const clonedData = JSON.parse(JSON.stringify(sessionData)) as SessionData;

    if (clonedData.companyData) {
      // Decrypt shareholder SSNs
      if (clonedData.companyData.shareholders) {
        clonedData.companyData.shareholders = clonedData.companyData.shareholders.map(
          (shareholder) => {
            if (shareholder.ssn && shareholder.ssn.startsWith('{')) {
              try {
                const encrypted = JSON.parse(shareholder.ssn);
                const decrypted = this.encryptionService.decrypt(encrypted);
                return {
                  ...shareholder,
                  ssn: decrypted,
                };
              } catch {
                // If decryption fails, return without SSN
                return {
                  ...shareholder,
                  ssn: undefined,
                };
              }
            }
            return shareholder;
          }
        );
      }

      // Decrypt payment info
      if (
        clonedData.companyData.paymentInfo?.encryptedData &&
        clonedData.companyData.paymentInfo.encryptedData.startsWith('{')
      ) {
        try {
          const encrypted = JSON.parse(
            clonedData.companyData.paymentInfo.encryptedData
          );
          const decrypted = this.encryptionService.decryptObject(encrypted) as any;
          clonedData.companyData.paymentInfo = decrypted;
        } catch {
          // If decryption fails, remove payment info
          clonedData.companyData.paymentInfo = undefined;
        }
      }
    }

    return clonedData;
  }

  /**
   * Get session file path
   */
  private getSessionPath(sessionId: string): string {
    return path.join(this.storageDir, `${sessionId}.json`);
  }

  /**
   * Save active session ID
   */
  private async saveActiveSessionId(sessionId: string): Promise<void> {
    const activePath = path.join(this.storageDir, ACTIVE_SESSION_FILE);
    await fs.writeFile(activePath, sessionId, 'utf8');
  }

  /**
   * Load active session ID
   */
  private async loadActiveSession(): Promise<void> {
    try {
      const activePath = path.join(this.storageDir, ACTIVE_SESSION_FILE);
      this.activeSessionId = await fs.readFile(activePath, 'utf8');
    } catch {
      // No active session
      this.activeSessionId = null;
    }
  }

  /**
   * Clear active session ID
   */
  private async clearActiveSessionId(): Promise<void> {
    try {
      const activePath = path.join(this.storageDir, ACTIVE_SESSION_FILE);
      await fs.unlink(activePath);
    } catch {
      // File doesn't exist, that's fine
    }
  }

  /**
   * Get current active session ID
   */
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  /**
   * Export session data for backend storage (FR-030)
   */
  async exportSessionForBackend(sessionId: string): Promise<Record<string, unknown>> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new SessionError(
        'Session not found',
        'SESSION_NOT_FOUND'
      );
    }

    // Remove sensitive local-only data
    const exportData = {
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status,
      companyData: session.companyData,
      metadata: session.metadata,
    };

    return exportData;
  }
}
