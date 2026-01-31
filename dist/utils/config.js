"use strict";
/**
 * Configuration management for Lovie CLI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.validateConfig = validateConfig;
exports.getAgentApiUrls = getAgentApiUrls;
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
// Load environment variables
(0, dotenv_1.config)();
/**
 * Get configuration from environment variables
 */
function getConfig() {
    return {
        apiBaseUrl: process.env['API_BASE_URL'] || 'https://api.lovie.ai',
        apiKey: process.env['API_KEY'] || '',
        sessionStoragePath: process.env['SESSION_STORAGE_PATH'] ||
            path_1.default.join(process.env['HOME'] || process.env['USERPROFILE'] || '', '.lovie', 'sessions'),
        logLevel: process.env['LOG_LEVEL'] || 'info',
        enableUpdateCheck: process.env['ENABLE_UPDATE_CHECK'] !== 'false',
        enableAnalytics: process.env['ENABLE_ANALYTICS'] === 'true',
    };
}
/**
 * Validate configuration
 */
function validateConfig(config) {
    if (!config.apiBaseUrl) {
        throw new Error('API_BASE_URL is required');
    }
    if (!config.apiKey && process.env['NODE_ENV'] === 'production') {
        throw new Error('API_KEY is required in production');
    }
}
/**
 * Get agent API URLs with environment-based selection
 */
function getAgentApiUrls() {
    const baseUrl = process.env['API_BASE_URL'] || 'https://api.lovie.ai';
    const isProduction = process.env['NODE_ENV'] === 'production';
    // Select NAME_CHECK_API_URL based on environment
    const nameCheckUrl = isProduction
        ? process.env['NAME_CHECK_API_URL_SERVER'] || `${baseUrl}/name-check`
        : process.env['NAME_CHECK_API_URL'] || 'http://localhost:3000';
    return {
        nameCheck: nameCheckUrl,
        documentFiller: process.env['DOCUMENT_FILLER_API_URL'] || `${baseUrl}/document-filler`,
        filing: process.env['FILING_AGENT_API_URL'] || `${baseUrl}/filing`,
    };
}
//# sourceMappingURL=config.js.map