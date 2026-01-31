"use strict";
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
exports.formationAuthStatusTool = exports.formationLogoutTool = exports.formationSetTokenTool = exports.formationLoginTool = void 0;
exports.getAuthToken = getAuthToken;
exports.getUserId = getUserId;
exports.isAuthenticated = isAuthenticated;
exports.registerAuthTools = registerAuthTools;
const index_1 = require("./index");
const errors_1 = require("../errors");
// In-memory token storage (per MCP session)
let authToken = null;
let userId = null;
let tokenStoredAt = null;
// Token persistence duration: 7 days in milliseconds
const TOKEN_PERSIST_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
// formation_login tool
exports.formationLoginTool = {
    name: 'formation_login',
    description: 'Start the login process by opening the Lovie dashboard in the browser. User will copy their session token from the dashboard.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
const handleFormationLogin = async (_args, _store) => {
    // Dynamic import of 'open' package
    const open = (await Promise.resolve().then(() => __importStar(require('open')))).default;
    const dashboardUrl = 'https://lovie-web.vercel.app/dashboard';
    // Open browser to dashboard
    await open(dashboardUrl);
    return {
        success: true,
        action: 'browser_opened',
        url: dashboardUrl,
        instructions: [
            '1. A browser window has been opened to the Lovie dashboard',
            '2. Log in if you are not already logged in',
            '3. On the dashboard, find and copy your **User ID** (starts with "user_...")',
            '4. Also copy the **session token** (starts with "eyJ...")',
            '5. Use formation_set_token to provide both the token and userId',
        ],
        nextStep: 'After copying both values, call formation_set_token with your token and userId.',
    };
};
// formation_set_token tool
exports.formationSetTokenTool = {
    name: 'formation_set_token',
    description: 'Set the authentication token and user ID after copying them from the Lovie dashboard. This authenticates your MCP session.',
    inputSchema: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'The session token from the Lovie dashboard (starts with "eyJ...")',
            },
            userId: {
                type: 'string',
                description: 'The User ID from the Lovie dashboard (starts with "user_...")',
            },
        },
        required: ['token', 'userId'],
    },
};
const handleFormationSetToken = async (args, _store) => {
    const token = args.token;
    const providedUserId = args.userId;
    if (!token) {
        throw (0, errors_1.validationError)('token', 'Token is required');
    }
    if (!token.startsWith('eyJ')) {
        throw (0, errors_1.validationError)('token', 'Invalid token format. Token should start with "eyJ..."');
    }
    if (!providedUserId) {
        throw (0, errors_1.validationError)('userId', 'User ID is required. Copy it from the dashboard (starts with "user_...")');
    }
    if (!providedUserId.startsWith('user_')) {
        throw (0, errors_1.validationError)('userId', 'Invalid User ID format. User ID should start with "user_..."');
    }
    // Validate JWT format
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw (0, errors_1.validationError)('token', 'Invalid JWT format');
        }
        // Note: We ignore the JWT's short expiry (Clerk tokens expire in ~60s)
        // Instead, we persist the token for 7 days on our side
        // The token is used for user identification, not for API calls that need fresh tokens
        // Store token and user info with our own timestamp
        authToken = token;
        userId = providedUserId; // Use the userId from dashboard, not from JWT
        tokenStoredAt = Date.now();
        // Calculate our 7-day expiry
        const ourExpiresAt = new Date(tokenStoredAt + TOKEN_PERSIST_DURATION_MS);
        const daysUntilExpiry = 7;
        return {
            success: true,
            authenticated: true,
            userId,
            expiresAt: ourExpiresAt.toISOString(),
            daysUntilExpiry,
            message: `Successfully authenticated as ${userId}! Your session will remain active for ${daysUntilExpiry} days. You can now use all formation tools.`,
        };
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Invalid')) {
            throw error;
        }
        throw (0, errors_1.validationError)('token', 'Failed to parse token. Please copy the complete token from the dashboard.');
    }
};
// formation_logout tool
exports.formationLogoutTool = {
    name: 'formation_logout',
    description: 'Clear the current authentication token and log out.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
const handleFormationLogout = async (_args, _store) => {
    const wasLoggedIn = authToken !== null;
    authToken = null;
    userId = null;
    tokenStoredAt = null;
    return {
        success: true,
        wasLoggedIn,
        message: wasLoggedIn
            ? 'Successfully logged out. Use formation_login to authenticate again.'
            : 'No active session to log out from.',
    };
};
// formation_auth_status tool
exports.formationAuthStatusTool = {
    name: 'formation_auth_status',
    description: 'Check the current authentication status.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
const handleFormationAuthStatus = async (_args, _store) => {
    if (!authToken || !tokenStoredAt) {
        return {
            authenticated: false,
            message: 'Not logged in. Use formation_login to authenticate.',
        };
    }
    // Check if our 7-day session has expired
    const sessionExpiresAt = tokenStoredAt + TOKEN_PERSIST_DURATION_MS;
    const isExpired = Date.now() > sessionExpiresAt;
    if (isExpired) {
        authToken = null;
        userId = null;
        tokenStoredAt = null;
        return {
            authenticated: false,
            message: 'Session expired (7 days). Use formation_login to authenticate again.',
        };
    }
    const daysRemaining = Math.ceil((sessionExpiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    return {
        authenticated: true,
        userId,
        expiresAt: new Date(sessionExpiresAt).toISOString(),
        daysRemaining,
        message: `Authenticated and session is valid. ${daysRemaining} day(s) remaining.`,
    };
};
// Helper function to get current auth token (for other tools to use)
function getAuthToken() {
    return authToken;
}
// Helper function to get current user ID (for other tools to use)
function getUserId() {
    return userId;
}
// Helper function to check if authenticated (uses our 7-day persistence)
function isAuthenticated() {
    if (!authToken || !tokenStoredAt)
        return false;
    // Check our 7-day session expiry, not the JWT's expiry
    const sessionExpiresAt = tokenStoredAt + TOKEN_PERSIST_DURATION_MS;
    return Date.now() < sessionExpiresAt;
}
// Register tools
function registerAuthTools() {
    (0, index_1.registerTool)(exports.formationLoginTool, handleFormationLogin);
    (0, index_1.registerTool)(exports.formationSetTokenTool, handleFormationSetToken);
    (0, index_1.registerTool)(exports.formationLogoutTool, handleFormationLogout);
    (0, index_1.registerTool)(exports.formationAuthStatusTool, handleFormationAuthStatus);
}
//# sourceMappingURL=auth.js.map