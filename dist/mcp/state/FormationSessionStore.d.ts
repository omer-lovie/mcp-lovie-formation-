import { FormationSession } from './types';
export declare class FormationSessionStore {
    create(userId?: string): Promise<FormationSession>;
    get(sessionId: string): Promise<FormationSession | null>;
    save(session: FormationSession): Promise<void>;
    delete(sessionId: string): Promise<boolean>;
    list(): Promise<FormationSession[]>;
    cleanup(): Promise<number>;
}
export declare function getSessionStore(): FormationSessionStore;
//# sourceMappingURL=FormationSessionStore.d.ts.map