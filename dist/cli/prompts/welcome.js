"use strict";
/**
 * Welcome prompt and initial setup
 * FR-006: Conversational, interactive prompts
 * FR-007: Plain language, avoid jargon
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showWelcome = showWelcome;
exports.confirmStartFresh = confirmStartFresh;
const inquirer_1 = __importDefault(require("inquirer"));
const formatter_1 = require("../utils/formatter");
const session_1 = require("../utils/session");
/**
 * Show welcome screen and check for existing sessions
 */
async function showWelcome() {
    // Show welcome message
    (0, formatter_1.print)((0, formatter_1.formatHeader)('Welcome to Lovie! 🚀'));
    (0, formatter_1.print)((0, formatter_1.formatInfo)('Let\'s help you form your company in just a few minutes.\n'));
    // Check for existing session
    if ((0, session_1.hasExistingSession)()) {
        const { resumeSession } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'resumeSession',
                message: 'We found an incomplete company formation. Would you like to continue where you left off?',
                default: true
            }
        ]);
        return {
            action: resumeSession ? 'resume' : 'new'
        };
    }
    return { action: 'new' };
}
/**
 * Show confirmation before starting fresh (when user has existing session)
 */
async function confirmStartFresh() {
    const { confirm } = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'This will discard your previous session. Are you sure you want to start fresh?',
            default: false
        }
    ]);
    return confirm;
}
//# sourceMappingURL=welcome.js.map