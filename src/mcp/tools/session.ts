import { registerTool, ToolDefinition } from './index';
import { FormationStep } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession, getCompletedSteps, getRemainingSteps, calculateProgress } from '../middleware/session';

// T018: formation_start tool
export const formationStartTool: ToolDefinition = {
  name: 'formation_start',
  description: 'Start a new company formation session. Returns a unique session ID and available formation states.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

const handleFormationStart = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const session = await store.create();
  return {
    sessionId: session.sessionId,
    availableStates: [
      { code: 'DE', name: 'Delaware', available: true },
    ],
    message: 'Formation session started. Please select a state using formation_set_state.',
  };
};

// T019: formation_get_status tool
export const formationGetStatusTool: ToolDefinition = {
  name: 'formation_get_status',
  description: 'Get the current status and progress of a formation session.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Session ID from formation_start',
      },
    },
    required: ['sessionId'],
  },
};

const handleFormationGetStatus = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  const companyType = session.companyDetails?.companyType;
  const completedSteps = getCompletedSteps(session.currentStep, companyType);
  const remainingSteps = getRemainingSteps(session.currentStep, companyType);
  const percentComplete = calculateProgress(session.currentStep, companyType);

  return {
    sessionId: session.sessionId,
    status: session.status,
    currentStep: session.currentStep,
    progress: {
      completedSteps,
      remainingSteps,
      percentComplete,
    },
    data: {
      companyDetails: session.companyDetails,
      registeredAgent: session.registeredAgent,
      shareStructure: session.shareStructure,
      shareholders: session.shareholders,
      authorizedParty: session.authorizedParty,
      nameCheckResult: session.nameCheckResult,
      certificateData: session.certificateData,
    },
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
};

// T046: formation_resume tool
export const formationResumeTool: ToolDefinition = {
  name: 'formation_resume',
  description: 'Resume an existing formation session. Returns the current state and next steps.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID to resume' },
    },
    required: ['sessionId'],
  },
};

const handleFormationResume = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  const companyType = session.companyDetails?.companyType;
  const completedSteps = getCompletedSteps(session.currentStep, companyType);
  const remainingSteps = getRemainingSteps(session.currentStep, companyType);

  // T048: Determine next action based on current step
  let nextAction: string;
  let nextActionDescription: string;

  switch (session.currentStep) {
    case FormationStep.CREATED:
      nextAction = 'formation_set_state';
      nextActionDescription = 'Select the formation state (Delaware)';
      break;
    case FormationStep.STATE_SELECTED:
      nextAction = 'formation_set_company_type';
      nextActionDescription = 'Select the company type (LLC, C-Corp, or S-Corp)';
      break;
    case FormationStep.TYPE_SELECTED:
      nextAction = 'formation_set_entity_ending';
      nextActionDescription = 'Select the entity ending (e.g., LLC, Inc.)';
      break;
    case FormationStep.ENDING_SELECTED:
      nextAction = 'formation_set_company_name';
      nextActionDescription = 'Set the company name';
      break;
    case FormationStep.NAME_SET:
      nextAction = 'formation_check_name';
      nextActionDescription = 'Check name availability (optional) or proceed to formation_set_registered_agent';
      break;
    case FormationStep.NAME_CHECKED:
      nextAction = 'formation_set_registered_agent';
      nextActionDescription = 'Set the registered agent';
      break;
    case FormationStep.AGENT_SET:
      nextAction = companyType === 'LLC' ? 'formation_add_shareholder' : 'formation_set_share_structure';
      nextActionDescription = companyType === 'LLC' ? 'Add members' : 'Set share structure';
      break;
    case FormationStep.SHARES_SET:
      nextAction = 'formation_add_shareholder';
      nextActionDescription = 'Add shareholders';
      break;
    case FormationStep.SHAREHOLDERS_ADDED:
      nextAction = 'formation_set_authorized_party';
      nextActionDescription = 'Set the authorized party';
      break;
    case FormationStep.AUTHORIZED_PARTY_SET:
      nextAction = 'formation_generate_certificate';
      nextActionDescription = 'Generate the certificate for review';
      break;
    case FormationStep.CERTIFICATE_GENERATED:
      nextAction = 'formation_approve_certificate';
      nextActionDescription = 'Review and approve the certificate';
      break;
    case FormationStep.CERTIFICATE_APPROVED:
    case FormationStep.COMPLETED:
      nextAction = 'formation_get_status';
      nextActionDescription = 'Formation is complete. Get final status.';
      break;
    default:
      nextAction = 'formation_get_status';
      nextActionDescription = 'Get current status';
  }

  return {
    success: true,
    sessionId: session.sessionId,
    currentStep: session.currentStep,
    status: session.status,
    data: {
      companyDetails: session.companyDetails,
      registeredAgent: session.registeredAgent,
      shareStructure: session.shareStructure,
      shareholders: session.shareholders,
      authorizedParty: session.authorizedParty,
      nameCheckResult: session.nameCheckResult,
      certificateData: session.certificateData,
    },
    progress: {
      completedSteps,
      remainingSteps,
      percentComplete: calculateProgress(session.currentStep, companyType),
    },
    nextAction,
    nextActionDescription,
    message: `Session resumed. Current step: ${session.currentStep}. Next: ${nextActionDescription}`,
  };
};

// Register tools
export function registerSessionTools(): void {
  registerTool(formationStartTool, handleFormationStart);
  registerTool(formationGetStatusTool, handleFormationGetStatus);
  registerTool(formationResumeTool, handleFormationResume);
}
