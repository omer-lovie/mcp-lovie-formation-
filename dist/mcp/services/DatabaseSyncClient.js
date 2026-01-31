"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseSyncClient = void 0;
exports.getDatabaseSyncClient = getDatabaseSyncClient;
const axios_1 = __importDefault(require("axios"));
class DatabaseSyncClient {
    constructor() {
        this.apiUrl = process.env.CENTRAL_DB_API_URL || '';
        this.apiKey = process.env.CENTRAL_DB_API_KEY || '';
        this.client = axios_1.default.create({
            baseURL: this.apiUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });
    }
    isConfigured() {
        return !!this.apiUrl && !!this.apiKey;
    }
    async syncFormation(session) {
        if (!this.isConfigured()) {
            return {
                success: false,
                error: 'Database sync is not configured. Set CENTRAL_DB_API_URL and CENTRAL_DB_API_KEY environment variables.',
            };
        }
        try {
            const response = await this.client.post('/formations', {
                sessionId: session.sessionId,
                companyDetails: session.companyDetails,
                registeredAgent: session.registeredAgent,
                shareStructure: session.shareStructure,
                shareholders: session.shareholders,
                authorizedParty: session.authorizedParty,
                nameCheckResult: session.nameCheckResult,
                certificateData: session.certificateData,
                status: session.status,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            });
            return {
                success: true,
                recordId: response.data.id || response.data.recordId,
                syncedAt: new Date().toISOString(),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Sync failed: ${errorMessage}`,
            };
        }
    }
}
exports.DatabaseSyncClient = DatabaseSyncClient;
// Singleton instance
let syncClient = null;
function getDatabaseSyncClient() {
    if (!syncClient) {
        syncClient = new DatabaseSyncClient();
    }
    return syncClient;
}
//# sourceMappingURL=DatabaseSyncClient.js.map