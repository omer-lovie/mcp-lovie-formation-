import { FormationSession, FormationStep, CompanyType } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
export declare function loadSession(sessionId: string, store: FormationSessionStore): Promise<FormationSession>;
export declare function calculateProgress(currentStep: FormationStep, companyType?: CompanyType): number;
export declare function getCompletedSteps(currentStep: FormationStep, companyType?: CompanyType): string[];
export declare function getRemainingSteps(currentStep: FormationStep, companyType?: CompanyType): string[];
export declare const STEP_DESCRIPTIONS: Record<FormationStep, string>;
//# sourceMappingURL=session.d.ts.map