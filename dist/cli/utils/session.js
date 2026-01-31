"use strict";
/**
 * Session management for resumable formation flows
 * FR-026: Persist user session data locally to support resume functionality
 * FR-027: Encrypt sensitive data at rest
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSessionId = generateSessionId;
exports.saveSession = saveSession;
exports.loadSession = loadSession;
exports.hasExistingSession = hasExistingSession;
exports.clearSession = clearSession;
exports.archiveSession = archiveSession;
exports.createSession = createSession;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const SESSION_DIR = path.join(os.homedir(), '.lovie');
const SESSION_FILE = path.join(SESSION_DIR, 'session.json');
/**
 * Ensure session directory exists
 */
function ensureSessionDirectory() {
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true, mode: 0o700 });
    }
}
/**
 * Generate unique session ID
 */
function generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Save session to disk
 */
function saveSession(session) {
    try {
        ensureSessionDirectory();
        // Update timestamp
        session.updatedAt = new Date();
        // Write to file (in production, should encrypt sensitive data)
        fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), {
            mode: 0o600 // Only owner can read/write
        });
    }
    catch (error) {
        console.error('Failed to save session:', error);
        throw new Error('Unable to save session data');
    }
}
/**
 * Load existing session from disk
 */
function loadSession() {
    try {
        if (!fs.existsSync(SESSION_FILE)) {
            return null;
        }
        const data = fs.readFileSync(SESSION_FILE, 'utf-8');
        const session = JSON.parse(data);
        // Convert date strings back to Date objects
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        return session;
    }
    catch (error) {
        console.error('Failed to load session:', error);
        return null;
    }
}
/**
 * Check if there's an existing incomplete session
 */
function hasExistingSession() {
    try {
        const session = loadSession();
        return session !== null && session.status === 'in_progress';
    }
    catch {
        return false;
    }
}
/**
 * Clear session data
 * FR-029: Clear sensitive data after completion or cancellation
 */
function clearSession() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            fs.unlinkSync(SESSION_FILE);
        }
    }
    catch (error) {
        console.error('Failed to clear session:', error);
    }
}
/**
 * Archive completed session
 */
function archiveSession(session) {
    try {
        ensureSessionDirectory();
        const archiveFile = path.join(SESSION_DIR, `session-${session.id}-${Date.now()}.json`);
        fs.writeFileSync(archiveFile, JSON.stringify(session, null, 2), {
            mode: 0o600
        });
    }
    catch (error) {
        console.error('Failed to archive session:', error);
    }
}
/**
 * Create new session
 */
function createSession() {
    return {
        id: generateSessionId(),
        currentStep: 0,
        data: {},
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date()
    };
}
//# sourceMappingURL=session.js.map