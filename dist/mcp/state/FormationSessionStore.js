"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormationSessionStore = void 0;
exports.getSessionStore = getSessionStore;
const uuid_1 = require("uuid");
const types_1 = require("./types");
// In-memory session store (for development/testing)
// In production, this would use Redis or a database
const sessions = new Map();
// Session TTL in milliseconds (24 hours)
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
class FormationSessionStore {
    // Create a new session
    async create(userId) {
        const now = new Date();
        const session = {
            sessionId: (0, uuid_1.v4)(),
            userId,
            status: types_1.SessionStatus.CREATED,
            currentStep: types_1.FormationStep.CREATED,
            shareholders: [],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
        };
        sessions.set(session.sessionId, session);
        return session;
    }
    // Get session by ID
    async get(sessionId) {
        return sessions.get(sessionId) || null;
    }
    // Save/update session
    async save(session) {
        session.updatedAt = new Date().toISOString();
        sessions.set(session.sessionId, session);
    }
    // Delete session
    async delete(sessionId) {
        return sessions.delete(sessionId);
    }
    // List all sessions (for debugging)
    async list() {
        return Array.from(sessions.values());
    }
    // Clean up expired sessions
    async cleanup() {
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
exports.FormationSessionStore = FormationSessionStore;
// Singleton instance
let storeInstance = null;
function getSessionStore() {
    if (!storeInstance) {
        storeInstance = new FormationSessionStore();
    }
    return storeInstance;
}
//# sourceMappingURL=FormationSessionStore.js.map