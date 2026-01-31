import { FormationSession } from '../state/types';
export interface SyncResult {
    success: boolean;
    recordId?: string;
    syncedAt?: string;
    error?: string;
}
export declare class DatabaseSyncClient {
    private client;
    private apiUrl;
    private apiKey;
    constructor();
    isConfigured(): boolean;
    syncFormation(session: FormationSession): Promise<SyncResult>;
}
export declare function getDatabaseSyncClient(): DatabaseSyncClient;
//# sourceMappingURL=DatabaseSyncClient.d.ts.map