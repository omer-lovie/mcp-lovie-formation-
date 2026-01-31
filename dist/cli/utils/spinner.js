"use strict";
/**
 * Spinner utilities for loading indicators
 * FR-009: Show loading indicators/spinners during background operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spinner = exports.SpinnerManager = void 0;
const ora_1 = __importDefault(require("ora"));
class SpinnerManager {
    constructor() {
        this.spinner = null;
    }
    /**
     * Start a spinner with a message
     */
    start(message) {
        if (this.spinner) {
            this.spinner.stop();
        }
        this.spinner = (0, ora_1.default)(message).start();
    }
    /**
     * Update spinner text
     */
    update(message) {
        if (this.spinner) {
            this.spinner.text = message;
        }
    }
    /**
     * Mark spinner as successful
     */
    succeed(message) {
        if (this.spinner) {
            this.spinner.succeed(message);
            this.spinner = null;
        }
    }
    /**
     * Mark spinner as failed
     */
    fail(message) {
        if (this.spinner) {
            this.spinner.fail(message);
            this.spinner = null;
        }
    }
    /**
     * Show warning
     */
    warn(message) {
        if (this.spinner) {
            this.spinner.warn(message);
            this.spinner = null;
        }
    }
    /**
     * Show info
     */
    info(message) {
        if (this.spinner) {
            this.spinner.info(message);
            this.spinner = null;
        }
    }
    /**
     * Stop spinner without status
     */
    stop() {
        if (this.spinner) {
            this.spinner.stop();
            this.spinner = null;
        }
    }
    /**
     * Check if spinner is active
     */
    isSpinning() {
        return this.spinner !== null;
    }
}
exports.SpinnerManager = SpinnerManager;
// Singleton instance
exports.spinner = new SpinnerManager();
//# sourceMappingURL=spinner.js.map