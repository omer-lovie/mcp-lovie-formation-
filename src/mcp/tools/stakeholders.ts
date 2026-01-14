import { v4 as uuidv4 } from 'uuid';
import { registerTool, ToolDefinition } from './index';
import { FormationStep, DEFAULT_REGISTERED_AGENT, DEFAULT_SHARE_STRUCTURE, RegisteredAgent, ShareStructure, Shareholder } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession } from '../middleware/session';
import { validationError, requiredFieldError } from '../errors';
import { safeValidateInput, emailSchema, validateTotalOwnership } from '../validation';

// T024: formation_set_registered_agent tool
export const formationSetRegisteredAgentTool: ToolDefinition = {
  name: 'formation_set_registered_agent',
  description: 'Set the registered agent for the company. Can use the recommended default (Harvard Business Services) or provide custom agent details.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      useDefault: { type: 'boolean', default: true, description: 'Use Harvard Business Services as registered agent (recommended, first year free)' },
      agent: {
        type: 'object',
        description: 'Custom agent details (required if useDefault is false)',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              street1: { type: 'string' },
              street2: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              county: { type: 'string' },
            },
            required: ['street1', 'city', 'state', 'zipCode'],
          },
        },
        required: ['name', 'email', 'phone', 'address'],
      },
    },
    required: ['sessionId'],
  },
};

const handleFormationSetRegisteredAgent = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const useDefault = args.useDefault !== false; // Default to true
  const agentInput = args.agent as Partial<RegisteredAgent> | undefined;

  const session = await loadSession(sessionId, store);

  let agent: RegisteredAgent;

  if (useDefault) {
    agent = { ...DEFAULT_REGISTERED_AGENT };
  } else {
    if (!agentInput) {
      throw requiredFieldError('agent');
    }
    if (!agentInput.name) throw requiredFieldError('agent.name');
    if (!agentInput.email) throw requiredFieldError('agent.email');
    if (!agentInput.phone) throw requiredFieldError('agent.phone');
    if (!agentInput.address) throw requiredFieldError('agent.address');

    agent = {
      isDefault: false,
      name: agentInput.name,
      email: agentInput.email,
      phone: agentInput.phone,
      address: agentInput.address,
    };
  }

  session.registeredAgent = agent;
  session.currentStep = FormationStep.AGENT_SET;
  await store.save(session);

  const nextStep = session.companyDetails?.companyType === 'LLC'
    ? 'formation_add_shareholder'
    : 'formation_set_share_structure';

  return {
    success: true,
    agent,
    message: `Registered agent set to ${agent.name}. Next step: ${nextStep}.`,
  };
};

// T025: formation_set_share_structure tool
export const formationSetShareStructureTool: ToolDefinition = {
  name: 'formation_set_share_structure',
  description: 'Set the share structure for corporations (C-Corp or S-Corp). Not applicable for LLCs.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      useDefault: { type: 'boolean', default: true, description: 'Use Silicon Valley standard (10M shares at $0.00001 par value)' },
      authorizedShares: { type: 'integer', minimum: 1, maximum: 1000000000, description: 'Number of authorized shares (required if useDefault is false)' },
      parValuePerShare: { type: 'number', minimum: 0, maximum: 1000, description: 'Par value per share in USD (required if useDefault is false)' },
    },
    required: ['sessionId'],
  },
};

const handleFormationSetShareStructure = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const useDefault = args.useDefault !== false;
  const authorizedShares = args.authorizedShares as number | undefined;
  const parValuePerShare = args.parValuePerShare as number | undefined;

  const session = await loadSession(sessionId, store);

  // LLCs don't have share structure
  if (session.companyDetails?.companyType === 'LLC') {
    return {
      success: true,
      message: 'Share structure is not applicable for LLCs. Skipping to shareholder/member information.',
    };
  }

  let shareStructure: ShareStructure;

  if (useDefault) {
    shareStructure = { ...DEFAULT_SHARE_STRUCTURE };
  } else {
    if (authorizedShares === undefined) throw requiredFieldError('authorizedShares');
    if (parValuePerShare === undefined) throw requiredFieldError('parValuePerShare');

    if (authorizedShares < 1 || authorizedShares > 1000000000) {
      throw validationError('authorizedShares', 'Must be between 1 and 1,000,000,000');
    }
    if (parValuePerShare < 0 || parValuePerShare > 1000) {
      throw validationError('parValuePerShare', 'Must be between 0 and 1000');
    }

    shareStructure = {
      isDefault: false,
      authorizedShares,
      parValuePerShare,
    };
  }

  session.shareStructure = shareStructure;
  session.currentStep = FormationStep.SHARES_SET;
  await store.save(session);

  return {
    success: true,
    shareStructure,
    message: 'Share structure set. Next step: Add shareholders using formation_add_shareholder.',
  };
};

// T026: formation_add_shareholder tool
export const formationAddShareholderTool: ToolDefinition = {
  name: 'formation_add_shareholder',
  description: 'Add a shareholder (for corps) or member (for LLCs) to the company. Can be called multiple times.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      shareholder: {
        type: 'object',
        properties: {
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          ownershipPercentage: { type: 'number', minimum: 0.01, maximum: 100 },
          address: {
            type: 'object',
            properties: {
              street1: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
            },
          },
        },
        required: ['firstName', 'lastName', 'email', 'ownershipPercentage'],
      },
    },
    required: ['sessionId', 'shareholder'],
  },
};

const handleFormationAddShareholder = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const shareholderInput = args.shareholder as Partial<Shareholder>;

  const session = await loadSession(sessionId, store);

  // Validate required fields
  if (!shareholderInput.firstName) throw requiredFieldError('shareholder.firstName');
  if (!shareholderInput.lastName) throw requiredFieldError('shareholder.lastName');
  if (!shareholderInput.email) throw requiredFieldError('shareholder.email');
  if (shareholderInput.ownershipPercentage === undefined) throw requiredFieldError('shareholder.ownershipPercentage');

  // Validate email
  const emailResult = safeValidateInput(emailSchema, shareholderInput.email);
  if (!emailResult.success) {
    throw validationError('shareholder.email', 'Invalid email format');
  }

  // Validate ownership percentage
  if (shareholderInput.ownershipPercentage < 0.01 || shareholderInput.ownershipPercentage > 100) {
    throw validationError('shareholder.ownershipPercentage', 'Must be between 0.01% and 100%');
  }

  const shareholder: Shareholder = {
    id: uuidv4(),
    firstName: shareholderInput.firstName,
    lastName: shareholderInput.lastName,
    email: shareholderInput.email,
    phone: shareholderInput.phone,
    ownershipPercentage: shareholderInput.ownershipPercentage,
    address: shareholderInput.address,
  };

  session.shareholders.push(shareholder);

  // Calculate total ownership
  const percentages = session.shareholders.map(s => s.ownershipPercentage);
  const ownershipCheck = validateTotalOwnership(percentages);

  session.currentStep = FormationStep.SHAREHOLDERS_ADDED;
  await store.save(session);

  const ownerType = session.companyDetails?.companyType === 'LLC' ? 'member' : 'shareholder';

  return {
    success: true,
    shareholderId: shareholder.id,
    shareholders: session.shareholders.map(s => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      ownershipPercentage: s.ownershipPercentage,
    })),
    totalOwnership: ownershipCheck.total,
    message: ownershipCheck.total < 100
      ? `${ownerType} added. Total ownership: ${ownershipCheck.total}%. Add more ${ownerType}s or proceed with formation_set_authorized_party.`
      : `${ownerType} added. Total ownership: ${ownershipCheck.total}%. Proceed with formation_set_authorized_party.`,
  };
};

// T027: formation_set_authorized_party tool
export const formationSetAuthorizedPartyTool: ToolDefinition = {
  name: 'formation_set_authorized_party',
  description: 'Set the person authorized to sign formation documents on behalf of the company.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      name: { type: 'string', description: 'Full legal name (first and last name)' },
      title: { type: 'string', description: "Title/position (e.g., 'Managing Member', 'President')" },
    },
    required: ['sessionId', 'name', 'title'],
  },
};

const handleFormationSetAuthorizedParty = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const name = args.name as string;
  const title = args.title as string;

  if (!name) throw requiredFieldError('name');
  if (!title) throw requiredFieldError('title');

  const session = await loadSession(sessionId, store);

  const authorizedParty = { name, title };
  session.authorizedParty = authorizedParty;
  session.currentStep = FormationStep.AUTHORIZED_PARTY_SET;
  await store.save(session);

  return {
    success: true,
    authorizedParty,
    message: 'Authorized party set. You can now check name availability with formation_check_name or generate the certificate with formation_generate_certificate.',
  };
};

// Register tools
export function registerStakeholderTools(): void {
  registerTool(formationSetRegisteredAgentTool, handleFormationSetRegisteredAgent);
  registerTool(formationSetShareStructureTool, handleFormationSetShareStructure);
  registerTool(formationAddShareholderTool, handleFormationAddShareholder);
  registerTool(formationSetAuthorizedPartyTool, handleFormationSetAuthorizedParty);
}
