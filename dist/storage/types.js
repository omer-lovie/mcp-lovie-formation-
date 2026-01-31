"use strict";
/**
 * Type definitions for session management system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionError = exports.SessionStatus = void 0;
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["IN_PROGRESS"] = "in_progress";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["ABANDONED"] = "abandoned";
    SessionStatus["ARCHIVED"] = "archived";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
class SessionError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'SessionError';
    }
}
exports.SessionError = SessionError;
//# sourceMappingURL=types.js.map