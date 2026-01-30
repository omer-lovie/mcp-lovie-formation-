import { registerTool, ToolDefinition } from './index';
import { FormationStep, ENTITY_ENDINGS, COMPANY_TYPE_DESCRIPTIONS, CompanyType, Address, AddressSource, CompanyAddress, USState, STATE_COMPANY_TYPES, STATE_DESCRIPTIONS, DEFAULT_INCORPORATOR } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession } from '../middleware/session';
import { validationError, requiredFieldError } from '../errors';
import { validateEntityEnding } from '../validation';
import { createNameCheckAgent } from '../../services/agents/NameCheckAgent';

// Incorporation process explanation for Delaware formations
const INCORPORATION_PROCESS_EXPLANATION = {
  title: 'How Delaware Incorporation Works',
  summary: 'Our legal team will incorporate your company and then transfer full ownership to you.',
  incorporator: {
    name: DEFAULT_INCORPORATOR.name,
    role: 'Lovie Legal Team - Professional Incorporator',
  },
  steps: [
    'Our incorporator files the Certificate of Incorporation with the Delaware Secretary of State',
    'Once filed, our legal team conducts the initial organizational actions (appointing directors, adopting bylaws, issuing stock)',
    'Full ownership and control is then transferred to you as the founder(s)',
    'You receive all corporate documents including the filed certificate, bylaws, and stock certificates',
  ],
  note: 'This is standard practice used by top law firms and incorporation services. It ensures proper legal formation and a clean corporate record from day one.',
};

// T020: formation_set_state tool
export const formationSetStateTool: ToolDefinition = {
  name: 'formation_set_state',
  description: 'Select the state for company formation. Supported: Delaware (DE) for LLC and C-Corp, Wyoming (WY) for LLC only.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      state: { type: 'string', enum: ['DE', 'WY'], description: 'State code: DE (Delaware) or WY (Wyoming)' },
    },
    required: ['sessionId', 'state'],
  },
};

const handleFormationSetState = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const state = args.state as USState;

  if (!['DE', 'WY'].includes(state)) {
    throw validationError('state', 'Only Delaware (DE) and Wyoming (WY) are currently supported');
  }

  const session = await loadSession(sessionId, store);

  // Get available company types for this state
  const availableTypes = STATE_COMPANY_TYPES[state];
  const businessDescription = session.companyDetails?.businessDescription;

  session.companyDetails = {
    ...session.companyDetails,
    state,
  };
  session.currentStep = FormationStep.STATE_SELECTED;
  await store.save(session);

  // Build company type options based on state
  const companyTypes = availableTypes.map(type => ({
    value: type,
    name: type === 'LLC' ? 'Limited Liability Company' : 'C Corporation',
    description: COMPANY_TYPE_DESCRIPTIONS[type],
  }));

  // Generate recommendation based on business description
  let recommendation = null;
  if (businessDescription) {
    const lowerDesc = businessDescription.toLowerCase();
    const suggestsVC = ['venture', 'vc', 'investor', 'fundrais', 'raise capital', 'startup', 'scale', 'series'].some(i => lowerDesc.includes(i));

    if (suggestsVC && state === 'DE') {
      recommendation = {
        type: 'C-Corp',
        reason: 'Based on your business description mentioning fundraising/investors, a C-Corp is recommended for venture-backed companies.',
      };
    } else if (state === 'WY') {
      recommendation = {
        type: 'LLC',
        reason: 'Wyoming only supports LLC formation. LLCs offer great privacy protections and no state income tax.',
      };
    } else {
      recommendation = {
        type: 'LLC',
        reason: 'An LLC offers flexibility and pass-through taxation, ideal for most small businesses.',
      };
    }
  }

  const stateFullName = state === 'DE' ? 'Delaware' : 'Wyoming';

  return {
    success: true,
    state,
    stateDescription: STATE_DESCRIPTIONS[state],
    companyTypes,
    recommendation,
    message: state === 'WY'
      ? `State set to ${stateFullName}. Wyoming supports LLC formation only. Please proceed with formation_set_company_type.`
      : `State set to ${stateFullName}. Please select a company type (LLC or C-Corp) using formation_set_company_type.`,
  };
};

// T021: formation_set_company_type tool
export const formationSetCompanyTypeTool: ToolDefinition = {
  name: 'formation_set_company_type',
  description: 'Select the type of company to form. Delaware supports LLC and C-Corp. Wyoming supports LLC only.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      companyType: { type: 'string', enum: ['LLC', 'C-Corp'], description: 'Type of company to form' },
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

  if (!['LLC', 'C-Corp'].includes(companyType)) {
    throw validationError('companyType', 'Must be LLC or C-Corp');
  }

  const session = await loadSession(sessionId, store);
  const state = session.companyDetails?.state;

  // Validate company type is available for selected state
  if (state) {
    const availableTypes = STATE_COMPANY_TYPES[state];
    if (!availableTypes.includes(companyType)) {
      throw validationError('companyType', `${companyType} is not available in ${state}. Available types: ${availableTypes.join(', ')}`);
    }
  }

  // Set the default incorporator for Delaware formations
  session.companyDetails = {
    ...session.companyDetails,
    companyType,
  };

  // Always use our legal team as incorporator for Delaware
  if (state === 'DE') {
    session.incorporator = DEFAULT_INCORPORATOR;
  }

  session.currentStep = FormationStep.TYPE_SELECTED;
  await store.save(session);

  const entityEndings = ENTITY_ENDINGS[companyType];

  // Add special note for LLC users about free upgrade (only if in Delaware)
  const upgradeNote = companyType === 'LLC' && state === 'DE'
    ? '💡 Special Offer: If you plan to raise money from investors in the future, Lovie offers a FREE upgrade from LLC to C-Corp! Just let us know when you\'re ready to raise funding.'
    : null;

  // Include incorporation process explanation for Delaware
  const incorporationProcess = state === 'DE' ? INCORPORATION_PROCESS_EXPLANATION : null;

  return {
    success: true,
    companyType,
    state,
    entityEndings,
    description: COMPANY_TYPE_DESCRIPTIONS[companyType],
    upgradeNote,
    incorporationProcess,
    confirmationRequired: true,
    confirmationMessage: `Please confirm: You want to form a ${state} ${companyType}. Is this correct? If yes, proceed with formation_set_entity_ending.`,
    message: `Company type set to ${companyType}. Please confirm this is correct and select an entity ending using formation_set_entity_ending.`,
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
    // T034: Handle timeout and errors - but allow user to continue
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Store failed check in session but allow continuation
    session.nameCheckResult = {
      available: false,
      checkedAt: new Date().toISOString(),
      reason: `Name check failed: ${errorMessage}`,
      error: true,
    };
    session.currentStep = FormationStep.NAME_CHECKED;
    await store.save(session);

    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      return {
        available: false,
        companyName,
        error: 'API_TIMEOUT',
        message: 'Name check timed out. The Delaware Secretary of State service may be slow.',
        canContinue: true,
        continueMessage: 'You can still proceed with the formation. The name will be verified during filing.',
        nextStep: 'Continue with formation_set_registered_agent to proceed.',
      };
    }

    return {
      available: false,
      companyName,
      error: 'NAME_CHECK_FAILED',
      message: `Name check failed: ${errorMessage}`,
      canContinue: true,
      continueMessage: 'You can still proceed with the formation. The name will be verified during filing.',
      nextStep: 'Continue with formation_set_registered_agent to proceed.',
    };
  }
};

// T035: formation_set_company_address tool
export const formationSetCompanyAddressTool: ToolDefinition = {
  name: 'formation_set_company_address',
  description: 'Set the company\'s principal business address. IMPORTANT: Ask the user if they have their own address or need assistance. Lovie has a partnership with Virtual Post Mail for virtual and physical addresses.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      source: {
        type: 'string',
        enum: ['own', 'need_assistance'],
        description: 'Address source: "own" if user has their own address, "need_assistance" if they need help getting an address',
      },
      virtualPostMailInterested: {
        type: 'boolean',
        description: 'Set to true if user is interested in Virtual Post Mail services for their business address',
      },
      address: {
        type: 'object',
        description: 'Company address details (required if source is "own")',
        properties: {
          street1: { type: 'string', description: 'Street address line 1' },
          street2: { type: 'string', description: 'Street address line 2 (optional)' },
          city: { type: 'string', description: 'City' },
          state: { type: 'string', description: 'State code (e.g., CA, NY, TX)' },
          zipCode: { type: 'string', description: 'ZIP code' },
          country: { type: 'string', default: 'US', description: 'Country code (default: US)' },
        },
        required: ['street1', 'city', 'state', 'zipCode'],
      },
    },
    required: ['sessionId', 'source'],
  },
};

const handleFormationSetCompanyAddress = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const source = args.source as AddressSource;
  const virtualPostMailInterested = args.virtualPostMailInterested as boolean | undefined;
  const addressInput = args.address as Partial<Address> | undefined;

  // Validate source
  if (!source || !['own', 'need_assistance'].includes(source)) {
    return {
      success: false,
      askUser: true,
      question: 'Do you have a business address for your company, or would you like assistance getting one?',
      options: [
        {
          value: 'own',
          label: 'I have my own address',
          description: 'Use your existing business or home address',
        },
        {
          value: 'need_assistance',
          label: 'I need an address',
          description: 'Get help setting up a virtual or physical business address through our Virtual Post Mail partnership',
        },
      ],
      partnerInfo: {
        name: 'Virtual Post Mail',
        description: 'Lovie partners with Virtual Post Mail to provide professional virtual mailbox services. Get a real street address for your business, mail scanning, and forwarding services.',
        benefits: [
          'Professional business address in any state',
          'Mail scanning and digital access',
          'Package forwarding',
          'Check depositing',
          'Privacy protection for home-based businesses',
        ],
      },
      message: 'Please ask the user if they have their own business address or need assistance getting one.',
    };
  }

  const session = await loadSession(sessionId, store);

  let companyAddress: CompanyAddress;

  if (source === 'own') {
    // User is providing their own address
    if (!addressInput) {
      throw requiredFieldError('address');
    }
    if (!addressInput.street1) throw requiredFieldError('address.street1');
    if (!addressInput.city) throw requiredFieldError('address.city');
    if (!addressInput.state) throw requiredFieldError('address.state');
    if (!addressInput.zipCode) throw requiredFieldError('address.zipCode');

    companyAddress = {
      source: 'own',
      virtualPostMailInterested: virtualPostMailInterested ?? false,
      address: {
        street1: addressInput.street1,
        street2: addressInput.street2 || null,
        city: addressInput.city,
        state: addressInput.state,
        zipCode: addressInput.zipCode,
        country: addressInput.country || 'US',
      },
    };

    session.companyDetails = {
      ...session.companyDetails,
      companyAddress,
    };
    session.currentStep = FormationStep.COMPANY_ADDRESS_SET;
    await store.save(session);

    return {
      success: true,
      companyAddress,
      message: `Company address set to ${companyAddress.address!.street1}, ${companyAddress.address!.city}, ${companyAddress.address!.state} ${companyAddress.address!.zipCode}. Proceed with formation_set_registered_agent.`,
    };
  } else {
    // User needs assistance - interested in Virtual Post Mail
    companyAddress = {
      source: 'need_assistance',
      virtualPostMailInterested: virtualPostMailInterested ?? true,
    };

    session.companyDetails = {
      ...session.companyDetails,
      companyAddress,
    };
    session.currentStep = FormationStep.COMPANY_ADDRESS_SET;
    await store.save(session);

    return {
      success: true,
      companyAddress,
      virtualPostMailInfo: {
        name: 'Virtual Post Mail',
        description: 'Our partner for virtual mailbox and business address services',
        website: 'https://www.virtualpostmail.com',
        benefits: [
          'Professional business address',
          'Mail scanning and digital viewing',
          'Package receiving and forwarding',
          'Check depositing services',
          'Multiple locations available',
        ],
        nextSteps: 'After your company is formed, we will connect you with Virtual Post Mail to set up your business address.',
      },
      message: 'Noted! You\'re interested in getting a business address through our Virtual Post Mail partnership. After your company is formed, we will help you set this up. Proceed with formation_set_registered_agent.',
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
  registerTool(formationSetCompanyAddressTool, handleFormationSetCompanyAddress);
}
