import { FormationSession, FormationStep, CompanyType } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { sessionNotFound, sessionExpired } from '../errors';

// Step order for progress calculation
const STEP_ORDER: FormationStep[] = [
  FormationStep.CREATED,
  FormationStep.STATE_SELECTED,
  FormationStep.TYPE_SELECTED,
  FormationStep.ENDING_SELECTED,
  FormationStep.NAME_SET,
  FormationStep.NAME_CHECKED,
  FormationStep.AGENT_SET,
  FormationStep.SHARES_SET,
  FormationStep.SHAREHOLDERS_ADDED,
  FormationStep.AUTHORIZED_PARTY_SET,
  FormationStep.CERTIFICATE_GENERATED,
  FormationStep.CERTIFICATE_APPROVED,
  FormationStep.COMPLETED,
];

// Steps for LLC (no share structure)
const LLC_STEP_ORDER: FormationStep[] = [
  FormationStep.CREATED,
  FormationStep.STATE_SELECTED,
  FormationStep.TYPE_SELECTED,
  FormationStep.ENDING_SELECTED,
  FormationStep.NAME_SET,
  FormationStep.NAME_CHECKED,
  FormationStep.AGENT_SET,
  FormationStep.SHAREHOLDERS_ADDED,
  FormationStep.AUTHORIZED_PARTY_SET,
  FormationStep.CERTIFICATE_GENERATED,
  FormationStep.CERTIFICATE_APPROVED,
  FormationStep.COMPLETED,
];

// Load and validate session
export async function loadSession(sessionId: string, store: FormationSessionStore): Promise<FormationSession> {
  const session = await store.get(sessionId);

  if (!session) {
    throw sessionNotFound(sessionId);
  }

  // Check expiration
  if (new Date(session.expiresAt) < new Date()) {
    throw sessionExpired(sessionId);
  }

  return session;
}

// Get step order based on company type
function getStepOrder(companyType?: CompanyType): FormationStep[] {
  return companyType === 'LLC' ? LLC_STEP_ORDER : STEP_ORDER;
}

// Calculate progress percentage
export function calculateProgress(currentStep: FormationStep, companyType?: CompanyType): number {
  const steps = getStepOrder(companyType);
  const currentIndex = steps.indexOf(currentStep);

  if (currentIndex === -1) return 0;

  return Math.round((currentIndex / (steps.length - 1)) * 100);
}

// Get completed steps
export function getCompletedSteps(currentStep: FormationStep, companyType?: CompanyType): string[] {
  const steps = getStepOrder(companyType);
  const currentIndex = steps.indexOf(currentStep);

  if (currentIndex === -1) return [];

  return steps.slice(0, currentIndex + 1);
}

// Get remaining steps
export function getRemainingSteps(currentStep: FormationStep, companyType?: CompanyType): string[] {
  const steps = getStepOrder(companyType);
  const currentIndex = steps.indexOf(currentStep);

  if (currentIndex === -1) return steps;

  return steps.slice(currentIndex + 1);
}

// Step descriptions for user-friendly messages
export const STEP_DESCRIPTIONS: Record<FormationStep, string> = {
  [FormationStep.CREATED]: 'Session created',
  [FormationStep.STATE_SELECTED]: 'Select formation state',
  [FormationStep.TYPE_SELECTED]: 'Select company type',
  [FormationStep.ENDING_SELECTED]: 'Select entity ending',
  [FormationStep.NAME_SET]: 'Set company name',
  [FormationStep.NAME_CHECKED]: 'Check name availability',
  [FormationStep.AGENT_SET]: 'Set registered agent',
  [FormationStep.SHARES_SET]: 'Set share structure',
  [FormationStep.SHAREHOLDERS_ADDED]: 'Add shareholders',
  [FormationStep.AUTHORIZED_PARTY_SET]: 'Set authorized party',
  [FormationStep.CERTIFICATE_GENERATED]: 'Generate certificate',
  [FormationStep.CERTIFICATE_APPROVED]: 'Approve certificate',
  [FormationStep.COMPLETED]: 'Formation complete',
};
