import { v4 as uuidv4 } from 'uuid';
import { registerTool, ToolDefinition } from './index';
import { FormationStep, DEFAULT_REGISTERED_AGENT, DEFAULT_SHARE_STRUCTURE, RegisteredAgent, ShareStructure, Shareholder, ShareholderRole, Address } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession } from '../middleware/session';
import { validationError, requiredFieldError } from '../errors';
import { safeValidateInput, emailSchema, validateTotalOwnership } from '../validation';

// T024: formation_set_registered_agent tool
export const formationSetRegisteredAgentTool: ToolDefinition = {
  name: 'formation_set_registered_agent',
  description: 'Set the registered agent for the company. IMPORTANT: Ask the user if they want to use Northwest Registered Agent (recommended, first year free) or provide their own custom agent details.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      useDefault: { type: 'boolean', description: 'Set to true to use Northwest Registered Agent (recommended). Set to false if user wants to provide their own agent.' },
      agent: {
        type: 'object',
        description: 'Custom agent details (required if useDefault is false). ASK THE USER for these details.',
        properties: {
          name: { type: 'string', description: 'Full name of registered agent' },
          email: { type: 'string', format: 'email', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          address: {
            type: 'object',
            properties: {
              street1: { type: 'string', description: 'Street address line 1' },
              street2: { type: 'string', description: 'Street address line 2 (optional)' },
              city: { type: 'string', description: 'City' },
              state: { type: 'string', description: 'State (must be DE for Delaware registered agent)' },
              zipCode: { type: 'string', description: 'ZIP code' },
              county: { type: 'string', description: 'County' },
            },
            required: ['street1', 'city', 'state', 'zipCode'],
          },
        },
        required: ['name', 'email', 'phone', 'address'],
      },
    },
    required: ['sessionId', 'useDefault'],
  },
};

const handleFormationSetRegisteredAgent = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const useDefault = args.useDefault as boolean | undefined;
  const agentInput = args.agent as Partial<RegisteredAgent> | undefined;

  // Require explicit choice - don't default to anything
  if (useDefault === undefined) {
    return {
      success: false,
      askUser: true,
      question: 'Would you like to use Northwest Registered Agent (recommended, first year free) or provide your own registered agent details?',
      options: [
        { value: true, label: 'Use Northwest Registered Agent (Recommended)', description: 'Professional registered agent service, first year free with Lovie' },
        { value: false, label: 'Provide my own registered agent', description: 'Use your own registered agent in Delaware' },
      ],
      message: 'Please ask the user which registered agent option they prefer before proceeding.',
    };
  }

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
    confirmationRequired: true,
    confirmationMessage: `Please confirm: Registered agent will be ${agent.name} at ${agent.address.street1}, ${agent.address.city}, ${agent.address.state} ${agent.address.zipCode}. Is this correct?`,
    message: `Registered agent set to ${agent.name}. Please confirm this is correct, then proceed with ${nextStep}.`,
  };
};

// T025: formation_set_share_structure tool
export const formationSetShareStructureTool: ToolDefinition = {
  name: 'formation_set_share_structure',
  description: 'Set the share structure for C-Corp. Not applicable for LLCs. IMPORTANT: For C-Corp, this must be confirmed before proceeding to shareholders.',
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

  // Calculate total par value that founders need to pay to the company
  const totalParValue = shareStructure.authorizedShares * shareStructure.parValuePerShare;
  const formattedParValue = totalParValue < 0.01
    ? `$${totalParValue.toFixed(5)}`
    : `$${totalParValue.toFixed(2)}`;

  return {
    success: true,
    shareStructure,
    totalParValue,
    formattedTotalParValue: formattedParValue,
    capitalFundingRequirement: {
      title: '⚠️ IMPORTANT: Capital Funding Requirement',
      explanation: 'By law, when shares are issued to shareholders, they must pay at least the par value to the company.',
      calculation: `${shareStructure.authorizedShares.toLocaleString()} authorized shares × $${shareStructure.parValuePerShare} par value = ${formattedParValue} total`,
      action: `After your company is formed, you will need to transfer ${formattedParValue} from your personal account to your company's bank account to comply with corporate law.`,
      note: 'This is a legal requirement - the par value represents the minimum capital that must be paid into the company when shares are issued.',
    },
    confirmationRequired: true,
    confirmationMessage: `Please confirm: You understand that ${formattedParValue} must be funded to the company's bank account after formation when shares are issued. Do you want to proceed with this share structure?`,
    message: `Share structure set. IMPORTANT: You will need to fund ${formattedParValue} to your company bank account after formation. Please confirm you understand this requirement, then add shareholders using formation_add_shareholder.`,
  };
};

// T026: formation_add_shareholder tool
export const formationAddShareholderTool: ToolDefinition = {
  name: 'formation_add_shareholder',
  description: 'Add a shareholder (for corps) or member (for LLCs) to the company. Can be called multiple times. IMPORTANT: Collect the full address for each shareholder/member.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      shareholder: {
        type: 'object',
        properties: {
          firstName: { type: 'string', minLength: 1, description: 'First name' },
          lastName: { type: 'string', minLength: 1, description: 'Last name' },
          email: { type: 'string', format: 'email', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number (e.g., +1-555-123-4567)' },
          ownershipPercentage: { type: 'number', minimum: 0.01, maximum: 100, description: 'Ownership percentage (0.01 to 100)' },
          role: {
            type: 'string',
            enum: ['member', 'managing_member', 'shareholder', 'director', 'officer'],
            description: 'Role in the company: "member" or "managing_member" for LLCs, "shareholder", "director", or "officer" for Corps',
          },
          address: {
            type: 'object',
            description: 'Full mailing address of the shareholder/member',
            properties: {
              street1: { type: 'string', description: 'Street address line 1' },
              street2: { type: 'string', description: 'Street address line 2 (apt, suite, etc.) - optional' },
              city: { type: 'string', description: 'City' },
              state: { type: 'string', description: 'State code (e.g., CA, NY, TX)' },
              zipCode: { type: 'string', description: 'ZIP code' },
              country: { type: 'string', default: 'US', description: 'Country code (default: US)' },
            },
            required: ['street1', 'city', 'state', 'zipCode'],
          },
        },
        required: ['firstName', 'lastName', 'email', 'ownershipPercentage', 'address'],
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
  const shareholderInput = args.shareholder as Partial<Shareholder> & { address?: Partial<Address> };

  const session = await loadSession(sessionId, store);

  const isLLC = session.companyDetails?.companyType === 'LLC';
  const ownerType = isLLC ? 'member' : 'shareholder';

  // Validate required fields
  if (!shareholderInput.firstName) throw requiredFieldError('shareholder.firstName');
  if (!shareholderInput.lastName) throw requiredFieldError('shareholder.lastName');
  if (!shareholderInput.email) throw requiredFieldError('shareholder.email');
  if (shareholderInput.ownershipPercentage === undefined) throw requiredFieldError('shareholder.ownershipPercentage');

  // Validate address is provided
  if (!shareholderInput.address) {
    throw requiredFieldError('shareholder.address');
  }
  if (!shareholderInput.address.street1) throw requiredFieldError('shareholder.address.street1');
  if (!shareholderInput.address.city) throw requiredFieldError('shareholder.address.city');
  if (!shareholderInput.address.state) throw requiredFieldError('shareholder.address.state');
  if (!shareholderInput.address.zipCode) throw requiredFieldError('shareholder.address.zipCode');

  // Validate email
  const emailResult = safeValidateInput(emailSchema, shareholderInput.email);
  if (!emailResult.success) {
    throw validationError('shareholder.email', 'Invalid email format');
  }

  // Validate ownership percentage
  if (shareholderInput.ownershipPercentage < 0.01 || shareholderInput.ownershipPercentage > 100) {
    throw validationError('shareholder.ownershipPercentage', 'Must be between 0.01% and 100%');
  }

  // Validate role if provided
  const validRoles: ShareholderRole[] = ['member', 'managing_member', 'shareholder', 'director', 'officer'];
  if (shareholderInput.role && !validRoles.includes(shareholderInput.role)) {
    throw validationError('shareholder.role', `Invalid role. Valid options: ${validRoles.join(', ')}`);
  }

  // Determine default role based on company type
  let role: ShareholderRole | undefined = shareholderInput.role;
  if (!role) {
    role = isLLC ? 'member' : 'shareholder';
  }

  const shareholder: Shareholder = {
    id: uuidv4(),
    firstName: shareholderInput.firstName,
    lastName: shareholderInput.lastName,
    email: shareholderInput.email,
    phone: shareholderInput.phone,
    ownershipPercentage: shareholderInput.ownershipPercentage,
    role,
    address: {
      street1: shareholderInput.address.street1,
      street2: shareholderInput.address.street2 || null,
      city: shareholderInput.address.city,
      state: shareholderInput.address.state,
      zipCode: shareholderInput.address.zipCode,
      country: shareholderInput.address.country || 'US',
    },
  };

  session.shareholders.push(shareholder);

  // Calculate total ownership
  const percentages = session.shareholders.map(s => s.ownershipPercentage);
  const ownershipCheck = validateTotalOwnership(percentages);

  session.currentStep = FormationStep.SHAREHOLDERS_ADDED;
  await store.save(session);

  return {
    success: true,
    shareholderId: shareholder.id,
    shareholders: session.shareholders.map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      ownershipPercentage: s.ownershipPercentage,
      role: s.role,
      address: s.address,
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
