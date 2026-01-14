import { registerTool, ToolDefinition } from './index';
import { FormationStep, ENTITY_ENDINGS, COMPANY_TYPE_DESCRIPTIONS, CompanyType } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession } from '../middleware/session';
import { validationError } from '../errors';
import { validateEntityEnding } from '../validation';
import { createNameCheckAgent } from '../../services/agents/NameCheckAgent';

// T020: formation_set_state tool
export const formationSetStateTool: ToolDefinition = {
  name: 'formation_set_state',
  description: 'Select the state for company formation. Currently only Delaware (DE) is supported.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      state: { type: 'string', enum: ['DE'], description: 'State code (currently only DE supported)' },
    },
    required: ['sessionId', 'state'],
  },
};

const handleFormationSetState = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const state = args.state as string;

  if (state !== 'DE') {
    throw validationError('state', 'Only Delaware (DE) is currently supported');
  }

  const session = await loadSession(sessionId, store);
  session.companyDetails = {
    ...session.companyDetails,
    state: 'DE',
  };
  session.currentStep = FormationStep.STATE_SELECTED;
  await store.save(session);

  return {
    success: true,
    companyTypes: [
      { value: 'LLC', name: 'Limited Liability Company', description: COMPANY_TYPE_DESCRIPTIONS['LLC'] },
      { value: 'C-Corp', name: 'C Corporation', description: COMPANY_TYPE_DESCRIPTIONS['C-Corp'] },
      { value: 'S-Corp', name: 'S Corporation', description: COMPANY_TYPE_DESCRIPTIONS['S-Corp'] },
    ],
    message: 'State set to Delaware. Please select a company type using formation_set_company_type.',
  };
};

// T021: formation_set_company_type tool
export const formationSetCompanyTypeTool: ToolDefinition = {
  name: 'formation_set_company_type',
  description: 'Select the type of company to form (LLC, C-Corp, or S-Corp).',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      companyType: { type: 'string', enum: ['LLC', 'C-Corp', 'S-Corp'], description: 'Type of company to form' },
    },
    required: ['sessionId', 'companyType'],
  },
};

const handleFormationSetCompanyType = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const companyType = args.companyType as CompanyType;

  if (!['LLC', 'C-Corp', 'S-Corp'].includes(companyType)) {
    throw validationError('companyType', 'Must be LLC, C-Corp, or S-Corp');
  }

  const session = await loadSession(sessionId, store);
  session.companyDetails = {
    ...session.companyDetails,
    companyType,
  };
  session.currentStep = FormationStep.TYPE_SELECTED;
  await store.save(session);

  const entityEndings = ENTITY_ENDINGS[companyType];

  return {
    success: true,
    entityEndings,
    description: COMPANY_TYPE_DESCRIPTIONS[companyType],
    message: `Company type set to ${companyType}. Please select an entity ending using formation_set_entity_ending.`,
  };
};

// T022: formation_set_entity_ending tool
export const formationSetEntityEndingTool: ToolDefinition = {
  name: 'formation_set_entity_ending',
  description: 'Select the legal suffix for the company name (e.g., LLC, Inc., Corp.).',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      entityEnding: { type: 'string', description: "Legal suffix (e.g., 'LLC', 'Inc.', 'Corp.')" },
    },
    required: ['sessionId', 'entityEnding'],
  },
};

const handleFormationSetEntityEnding = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const entityEnding = args.entityEnding as string;

  const session = await loadSession(sessionId, store);
  const companyType = session.companyDetails?.companyType;

  if (!companyType) {
    throw validationError('companyType', 'Company type must be set first');
  }

  if (!validateEntityEnding(entityEnding, companyType)) {
    const validEndings = ENTITY_ENDINGS[companyType].join(', ');
    throw validationError('entityEnding', `Invalid entity ending for ${companyType}. Valid options: ${validEndings}`);
  }

  session.companyDetails = {
    ...session.companyDetails,
    entityEnding,
  };
  session.currentStep = FormationStep.ENDING_SELECTED;
  await store.save(session);

  return {
    success: true,
    entityEnding,
    message: 'Entity ending set. Please set the company name using formation_set_company_name.',
  };
};

// T023: formation_set_company_name tool
export const formationSetCompanyNameTool: ToolDefinition = {
  name: 'formation_set_company_name',
  description: 'Set the company base name. The entity ending will be automatically appended to form the full legal name.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      baseName: { type: 'string', minLength: 3, maxLength: 200, description: 'Company name without the entity ending' },
    },
    required: ['sessionId', 'baseName'],
  },
};

const handleFormationSetCompanyName = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const baseName = args.baseName as string;

  if (!baseName || baseName.length < 3) {
    throw validationError('baseName', 'Company name must be at least 3 characters');
  }
  if (baseName.length > 200) {
    throw validationError('baseName', 'Company name must be at most 200 characters');
  }

  const session = await loadSession(sessionId, store);
  const entityEnding = session.companyDetails?.entityEnding;

  if (!entityEnding) {
    throw validationError('entityEnding', 'Entity ending must be set first');
  }

  const fullName = `${baseName} ${entityEnding}`;

  if (fullName.length > 245) {
    throw validationError('fullName', 'Full company name exceeds Delaware limit of 245 characters');
  }

  session.companyDetails = {
    ...session.companyDetails,
    baseName,
    fullName,
  };
  session.currentStep = FormationStep.NAME_SET;
  await store.save(session);

  return {
    success: true,
    baseName,
    fullName,
    message: `Company name set to "${fullName}". You can check name availability using formation_check_name, or continue with formation_set_registered_agent.`,
  };
};

// T033: formation_check_name tool
export const formationCheckNameTool: ToolDefinition = {
  name: 'formation_check_name',
  description: 'Check if the company name is available with the Delaware Secretary of State. This may take up to 60 seconds.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
    },
    required: ['sessionId'],
  },
};

const handleFormationCheckName = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  const companyName = session.companyDetails?.fullName;
  const state = session.companyDetails?.state;
  const companyType = session.companyDetails?.companyType;

  if (!companyName) {
    throw validationError('companyName', 'Company name must be set first using formation_set_company_name');
  }

  try {
    const agent = createNameCheckAgent();
    const startTime = Date.now();

    const result = await agent.checkAvailability({
      companyName,
      state: state || 'DE',
      companyType: companyType || 'LLC',
    });

    const responseTimeMs = Date.now() - startTime;

    // Store result in session
    session.nameCheckResult = {
      available: result.available,
      checkedAt: new Date().toISOString(),
      reason: result.reason,
      suggestions: result.suggestions,
      responseTimeMs,
    };
    session.currentStep = FormationStep.NAME_CHECKED;
    await store.save(session);

    return {
      available: result.available,
      companyName,
      reason: result.reason,
      suggestions: result.suggestions,
      checkedAt: session.nameCheckResult.checkedAt,
    };
  } catch (error) {
    // T034: Handle timeout and errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      return {
        available: false,
        companyName,
        error: 'API_TIMEOUT',
        message: 'Name check timed out. The Delaware Secretary of State service may be slow. Please try again.',
        retryable: true,
        suggestion: 'Wait a few moments and call formation_check_name again.',
      };
    }

    return {
      available: false,
      companyName,
      error: 'NAME_CHECK_FAILED',
      message: `Name check failed: ${errorMessage}`,
      retryable: true,
      suggestion: 'Please try again later or proceed with a different company name.',
    };
  }
};

// Register tools
export function registerCompanyTools(): void {
  registerTool(formationSetStateTool, handleFormationSetState);
  registerTool(formationSetCompanyTypeTool, handleFormationSetCompanyType);
  registerTool(formationSetEntityEndingTool, handleFormationSetEntityEnding);
  registerTool(formationSetCompanyNameTool, handleFormationSetCompanyName);
  registerTool(formationCheckNameTool, handleFormationCheckName);
}
