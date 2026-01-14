# Session Storage Module

## Overview

Secure, encrypted session management system for Lovie CLI company formation flow.

## Features

- ✅ **FR-026**: Local file-based session persistence
- ✅ **FR-027**: AES-256-GCM encryption for sensitive data
- ✅ **FR-028**: Unique session ID generation (UUID v4 + timestamp)
- ✅ **FR-029**: Automatic cleanup and sensitive data clearing
- ✅ **User Story 4 (P3)**: Resume interrupted formation sessions

## Quick Start

```typescript
import { SessionManager } from './storage';

// Initialize
const manager = new SessionManager();
await manager.initialize();

// Create session
const session = await manager.createSession();

// Update with company data
await manager.updateSession(session.sessionId, {
  companyName: 'My Company LLC',
  state: 'Delaware',
  companyType: 'LLC',
});

// Resume later
const resumed = await manager.resumeSession();

// Complete when done
await manager.completeSession(session.sessionId);
```

## Security

### Encrypted Data
- Social Security Numbers (SSN)
- Payment information (card numbers, CVV, etc.)
- Any sensitive shareholder data

### Encryption Specs
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Authentication**: AEAD with auth tags
- **Integrity**: HMAC-SHA256 checksums for backups

### Key Management

**Development:**
```typescript
// Uses default key (with warning)
const manager = new SessionManager();
```

**Production:**
```bash
export LOVIE_ENCRYPTION_KEY="$(openssl rand -base64 32)"
```

```typescript
const manager = new SessionManager({
  encryptionKey: process.env.LOVIE_ENCRYPTION_KEY
});
```

## Architecture

### Files Created

```
~/.lovie/sessions/
├── session-{timestamp}-{uuid}.json    # Session data (encrypted)
├── active_session.json                 # Current active session ID
└── backups/
    └── session-{id}-backup-{ts}.json  # Automatic backups
```

### Session Lifecycle

```
CREATE → IN_PROGRESS → [COMPLETED | ABANDONED] → ARCHIVED → DELETED
                ↓
            (Resume)
```

## API Reference

### SessionManager

#### Constructor Options
```typescript
interface StorageOptions {
  storageDir?: string;              // Default: ~/.lovie/sessions
  encryptionKey?: string;           // Encryption key
  backupEnabled?: boolean;          // Default: true
  backupRetentionDays?: number;     // Default: 30
  autoCleanup?: boolean;            // Default: true
  cleanupAfterDays?: number;        // Default: 90
}
```

#### Methods

**Core Operations:**
- `initialize(): Promise<void>` - Initialize storage
- `createSession(metadata?): Promise<SessionData>` - Create new session
- `loadSession(id): Promise<SessionData | null>` - Load session
- `updateSession(id, data, step?): Promise<SessionData>` - Update session
- `saveSession(data): Promise<void>` - Save session (auto-called by update)
- `deleteSession(id): Promise<void>` - Delete session

**Session Control:**
- `resumeSession(): Promise<SessionData | null>` - Resume most recent
- `completeSession(id): Promise<void>` - Mark complete and clear sensitive data
- `abandonSession(id): Promise<void>` - Mark abandoned
- `getActiveSessionId(): string | null` - Get current active session

**Data Management:**
- `clearSensitiveData(id): Promise<void>` - Remove SSN/payment info
- `listSessions(query?): Promise<SessionData[]>` - Query sessions
- `exportSessionForBackend(id): Promise<object>` - Export for API

**Backup & Recovery:**
- `createBackup(data): Promise<SessionBackup>` - Create backup
- `restoreFromBackup(id): Promise<SessionData>` - Restore from backup

**Maintenance:**
- `cleanupOldSessions(): Promise<number>` - Clean old sessions/backups

### EncryptionService

```typescript
class EncryptionService {
  encrypt(plaintext: string): EncryptionResult
  decrypt(params: DecryptionParams): string
  encryptObject<T>(obj: T): EncryptionResult
  decryptObject<T>(params: DecryptionParams): T
  encryptSSN(ssn: string): EncryptionResult
  encryptPaymentInfo(info: object): EncryptionResult
  hash(data: string): string
  generateToken(length?: number): string
  createChecksum(data: string): string
  verifyChecksum(data: string, checksum: string): boolean
}
```

## Examples

### Complete Formation Flow

```typescript
// 1. Initialize
const manager = new SessionManager();
await manager.initialize();

// 2. Check for existing session
const existing = await manager.resumeSession();
if (existing) {
  // Ask user to resume or start fresh
}

// 3. Create new session
const session = await manager.createSession({
  cliVersion: '1.0.0',
});

// 4. Collect company info
await manager.updateSession(session.sessionId, {
  companyName: 'Acme Corp',
  state: 'Delaware',
  companyType: 'LLC',
}, 'company-details');

// 5. Collect shareholders
await manager.updateSession(session.sessionId, {
  shareholders: [{
    name: 'John Doe',
    ssn: '123-45-6789', // Encrypted automatically
    ownershipPercentage: 100,
  }],
}, 'shareholders');

// 6. Payment
await manager.updateSession(session.sessionId, {
  paymentInfo: {
    cardNumber: '4111111111111111', // Encrypted
    cvv: '123',
    expiry: '12/25',
  },
}, 'payment');

// 7. Export and send to backend
const exportData = await manager.exportSessionForBackend(session.sessionId);
await api.post('/sessions', exportData);

// 8. Complete
await manager.completeSession(session.sessionId);
```

### Error Handling

```typescript
import { SessionError } from './storage';

try {
  const session = await manager.loadSession(id);
} catch (error) {
  if (error instanceof SessionError) {
    switch (error.code) {
      case 'SESSION_NOT_FOUND':
        console.log('Session not found');
        break;
      case 'DECRYPTION_ERROR':
        console.log('Cannot decrypt - wrong key?');
        // Try backup recovery
        break;
      default:
        console.error(error.message);
    }
  }
}
```

## Testing

```bash
# Run all storage tests
npm test tests/storage

# Run with coverage
npm test -- --coverage tests/storage

# Run specific test
npm test tests/storage/SessionManager.test.ts
```

Test coverage includes:
- ✅ Session creation and unique IDs
- ✅ Save/load persistence
- ✅ SSN encryption/decryption
- ✅ Payment info encryption
- ✅ Session resume functionality
- ✅ Sensitive data clearing
- ✅ Session lifecycle (complete/abandon)
- ✅ Backup and recovery
- ✅ Cleanup operations
- ✅ Error handling
- ✅ Checksum verification
- ✅ Data integrity

## Performance

- **Session Creation**: < 10ms
- **Load Session**: < 5ms
- **Save Session**: < 10ms (includes backup creation)
- **Encryption**: < 1ms per field
- **List Sessions**: O(n) where n = number of files
- **Cleanup**: O(n) where n = total files

## Storage Requirements

- Session file: 1-10 KB
- With backups: ~2-3x size
- 1000 sessions ≈ 10-30 MB

## Security Considerations

✅ **DO:**
- Use strong encryption keys (32+ bytes)
- Rotate keys periodically
- Set `LOVIE_ENCRYPTION_KEY` in production
- Enable backups
- Clear sensitive data after completion
- Set proper file permissions (600)

❌ **DON'T:**
- Commit encryption keys to git
- Use default key in production
- Store plaintext sensitive data
- Share session files across users
- Expose session IDs publicly

## Troubleshooting

### Cannot Decrypt Session
**Cause**: Key changed or data corrupted
**Fix**: Restore from backup or re-collect data

### Storage Full
**Cause**: Too many old sessions
**Fix**: Run `cleanupOldSessions()` or reduce retention days

### Permission Denied
**Cause**: Insufficient directory permissions
**Fix**: `chmod 700 ~/.lovie/sessions`

## Related Documentation

- [SessionManagement.md](../../docs/SessionManagement.md) - Full documentation
- [session-usage.ts](../../docs/examples/session-usage.ts) - Complete examples
- [spec.md](../../specs/001-company-formation-cli/spec.md) - Requirements

## Support

For issues or questions:
1. Check tests for usage examples
2. Review documentation
3. Check error codes in `types.ts`
4. File issue with reproduction steps
