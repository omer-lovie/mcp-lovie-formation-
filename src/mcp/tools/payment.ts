import { registerTool, ToolDefinition } from './index';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession } from '../middleware/session';
import { validationError } from '../errors';
import { PaymentStatus } from '../state/types';

// Stripe payment links (test mode for now)
const STRIPE_PAYMENT_LINKS = {
  LLC: 'https://buy.stripe.com/test_llc_formation_placeholder',
  'C-Corp': 'https://buy.stripe.com/test_ccorp_formation_placeholder',
};

// Lovie dashboard URL for tracking
const LOVIE_DASHBOARD_URL = 'https://lovie-web.vercel.app/dashboard';
const LOVIE_APP_STORE_URL = 'https://apps.apple.com/app/lovie'; // placeholder
const LOVIE_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.lovie'; // placeholder

// formation_get_payment_link tool
export const formationGetPaymentLinkTool: ToolDefinition = {
  name: 'formation_get_payment_link',
  description: 'Get the Stripe payment link for the formation. Call this after all information has been collected and the certificate has been approved. The user must complete payment before the formation is processed.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
    },
    required: ['sessionId'],
  },
};

const handleFormationGetPaymentLink = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  // Validate session has all required data before payment
  if (!session.companyDetails?.fullName) {
    throw validationError('companyDetails.name', 'Company name is required before payment');
  }

  if (!session.companyDetails?.state) {
    throw validationError('companyDetails.state', 'State is required before payment');
  }

  if (!session.companyDetails?.companyType) {
    throw validationError('companyDetails.entityType', 'Company type is required before payment');
  }

  if (!session.companyDetails?.companyAddress) {
    throw validationError('companyDetails.companyAddress', 'Company address is required before payment');
  }

  if (!session.shareholders || session.shareholders.length === 0) {
    throw validationError('shareholders', 'At least one shareholder/member is required before payment');
  }

  if (!session.registeredAgent) {
    throw validationError('registeredAgent', 'Registered agent is required before payment');
  }

  if (!session.authorizedParty) {
    throw validationError('authorizedParty', 'Authorized party is required before payment');
  }

  // Validate ownership percentages sum to 100
  const totalOwnership = session.shareholders.reduce((sum, s) => sum + s.ownershipPercentage, 0);
  if (Math.abs(totalOwnership - 100) > 0.01) {
    throw validationError('shareholders', `Shareholder ownership must sum to 100% (currently ${totalOwnership}%)`);
  }

  const companyType = session.companyDetails.companyType as 'LLC' | 'C-Corp';
  const paymentLink = STRIPE_PAYMENT_LINKS[companyType];

  // Add session ID to payment link for tracking
  const paymentLinkWithSession = `${paymentLink}?client_reference_id=${sessionId}`;

  // Mark session as awaiting payment
  session.paymentStatus = 'pending' as PaymentStatus;
  await store.save(session);

  return {
    success: true,
    paymentRequired: true,
    paymentLink: paymentLinkWithSession,
    companyName: session.companyDetails.fullName,
    companyType: session.companyDetails.companyType,
    state: session.companyDetails.state,
    message: 'Please complete the payment to proceed with your company formation.',
    instructions: [
      '1. Click the payment link above to pay via Stripe',
      '2. After payment, your formation will be automatically submitted',
      '3. Track your formation progress on the Lovie dashboard or mobile app',
    ],
    nextStep: 'After payment is complete, call formation_confirm_payment to confirm and submit your formation.',
  };
};

// formation_confirm_payment tool
export const formationConfirmPaymentTool: ToolDefinition = {
  name: 'formation_confirm_payment',
  description: 'Confirm that payment has been completed and submit the formation. Call this after the user has completed the Stripe payment.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
      paymentConfirmed: {
        type: 'boolean',
        description: 'Set to true to confirm the user has completed payment'
      },
    },
    required: ['sessionId', 'paymentConfirmed'],
  },
};

const handleFormationConfirmPayment = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const paymentConfirmed = args.paymentConfirmed as boolean;
  const session = await loadSession(sessionId, store);

  if (!paymentConfirmed) {
    return {
      success: false,
      message: 'Payment must be completed before proceeding. Please complete the Stripe payment first.',
      paymentLink: STRIPE_PAYMENT_LINKS[session.companyDetails?.companyType as 'LLC' | 'C-Corp'] || STRIPE_PAYMENT_LINKS.LLC,
    };
  }

  // Mark payment as completed
  session.paymentStatus = 'completed' as PaymentStatus;
  session.paymentCompletedAt = new Date().toISOString();
  await store.save(session);

  return {
    success: true,
    paymentStatus: 'completed',
    message: 'Payment confirmed! Your formation will now be submitted.',
    nextStep: 'Call formation_submit to submit your formation request.',
  };
};

// formation_track_progress tool
export const formationTrackProgressTool: ToolDefinition = {
  name: 'formation_track_progress',
  description: 'Get links to track the formation progress on the Lovie dashboard and mobile app. Call this after the formation has been submitted.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
    },
    required: ['sessionId'],
  },
};

const handleFormationTrackProgress = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  return {
    success: true,
    sessionId,
    companyName: session.companyDetails?.fullName || 'Your Company',
    trackingOptions: {
      webDashboard: {
        url: LOVIE_DASHBOARD_URL,
        description: 'Track your formation on the Lovie web dashboard',
      },
      mobileApp: {
        ios: LOVIE_APP_STORE_URL,
        android: LOVIE_PLAY_STORE_URL,
        description: 'Download the Lovie mobile app to track your formation on the go',
      },
    },
    message: 'Your formation has been submitted! Track your progress using the links above.',
    nextSteps: [
      'Create a Lovie account on the dashboard to track your formation',
      'You will receive email updates as your formation progresses',
      'Once completed, your certificate will be available for download',
    ],
  };
};

// Register tools
export function registerPaymentTools(): void {
  registerTool(formationGetPaymentLinkTool, handleFormationGetPaymentLink);
  registerTool(formationConfirmPaymentTool, handleFormationConfirmPayment);
  registerTool(formationTrackProgressTool, handleFormationTrackProgress);
}
