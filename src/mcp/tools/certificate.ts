import { registerTool, ToolDefinition } from './index';
import { FormationStep, SessionStatus } from '../state/types';
import { FormationSessionStore } from '../state/FormationSessionStore';
import { loadSession } from '../middleware/session';
import { validationError, MCPToolError, ErrorCode } from '../errors';
import { CertificateApiClient } from '../../services/certificate/api';

// T039: formation_generate_certificate tool
export const formationGenerateCertificateTool: ToolDefinition = {
  name: 'formation_generate_certificate',
  description: 'Generate the certificate of incorporation. Returns an S3 URL for the user to review the PDF document.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
    },
    required: ['sessionId'],
  },
};

const handleFormationGenerateCertificate = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  // Validate all required data is present
  if (!session.companyDetails?.fullName) {
    throw validationError('companyName', 'Company name must be set before generating certificate');
  }
  if (!session.registeredAgent) {
    throw validationError('registeredAgent', 'Registered agent must be set before generating certificate');
  }
  if (session.shareholders.length === 0) {
    throw validationError('shareholders', 'At least one shareholder/member must be added before generating certificate');
  }
  if (!session.authorizedParty) {
    throw validationError('authorizedParty', 'Authorized party must be set before generating certificate');
  }

  try {
    // Create certificate API client
    const certificateClient = new CertificateApiClient();

    // Build the request payload for the certificate API
    const request = {
      companyName: session.companyDetails.fullName,
      registeredAgent: {
        name: session.registeredAgent.name,
        address: {
          street: session.registeredAgent.address.street1,
          city: session.registeredAgent.address.city,
          state: session.registeredAgent.address.state,
          zipCode: session.registeredAgent.address.zipCode,
          county: session.registeredAgent.address.county || 'Sussex',
        },
      },
      sharesAuthorized: session.shareStructure?.authorizedShares || 0,
      parValue: session.shareStructure?.parValuePerShare || 0,
    };

    // Call the existing certificate generation API
    const result = await certificateClient.generateCertificate(request);

    // T041: Calculate expiration time (use API response or default to 60 minutes)
    const expiresAt = result.expiresAt;
    const minutesRemaining = certificateClient.getMinutesRemaining(expiresAt);

    // Store certificate data in session
    const certificateData = {
      certificateId: result.certificateId,
      downloadUrl: result.downloadUrl,
      s3Uri: result.s3Uri,
      expiresAt,
      generatedAt: result.metadata.generatedAt,
      fileSize: result.metadata.fileSize,
      fileHash: result.metadata.fileHash,
    };

    session.certificateData = certificateData as any;
    session.currentStep = FormationStep.CERTIFICATE_GENERATED;
    session.status = SessionStatus.REVIEW;
    await store.save(session);

    return {
      success: true,
      certificateId: certificateData.certificateId,
      downloadUrl: certificateData.downloadUrl,
      expiresAt,
      minutesRemaining,
      instructions: 'Please review the certificate at the provided URL. Once you have reviewed it, use formation_approve_certificate to approve and complete the formation, or update the company details and regenerate if changes are needed.',
    };
  } catch (error) {
    // Re-throw MCPToolError as-is
    if (error instanceof MCPToolError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new MCPToolError({
      code: ErrorCode.CERTIFICATE_GENERATION_FAILED,
      message: `Certificate generation failed: ${errorMessage}`,
      retryable: true,
      suggestion: 'Please verify all formation data is correct and try again.',
    });
  }
};

// T040: formation_approve_certificate tool
export const formationApproveCertificateTool: ToolDefinition = {
  name: 'formation_approve_certificate',
  description: 'Approve the generated certificate after user review. This marks the formation as ready for payment.',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string', description: 'Session ID from formation_start' },
    },
    required: ['sessionId'],
  },
};

const handleFormationApproveCertificate = async (
  args: Record<string, unknown>,
  store: FormationSessionStore
) => {
  const sessionId = args.sessionId as string;
  const session = await loadSession(sessionId, store);

  // Verify certificate exists
  if (!session.certificateData) {
    throw new MCPToolError({
      code: ErrorCode.CERTIFICATE_NOT_GENERATED,
      message: 'No certificate has been generated yet',
      retryable: false,
      suggestion: 'Generate a certificate first using formation_generate_certificate',
    });
  }

  // Check if URL expired
  const certificateData = session.certificateData as any;
  if (certificateData.expiresAt && new Date(certificateData.expiresAt) < new Date()) {
    throw new MCPToolError({
      code: ErrorCode.CERTIFICATE_URL_EXPIRED,
      message: 'Certificate URL has expired',
      retryable: true,
      suggestion: 'Generate a new certificate using formation_generate_certificate',
    });
  }

  // T042: Mark as approved and complete
  certificateData.approvedAt = new Date().toISOString();
  session.certificateData = certificateData;
  session.currentStep = FormationStep.CERTIFICATE_APPROVED;
  session.status = SessionStatus.COMPLETED;
  await store.save(session);

  // Build complete formation data for payment processing
  const formationData = {
    sessionId: session.sessionId,
    companyDetails: session.companyDetails,
    registeredAgent: session.registeredAgent,
    shareStructure: session.shareStructure,
    shareholders: session.shareholders,
    authorizedParty: session.authorizedParty,
    nameCheckResult: session.nameCheckResult,
    certificateData: session.certificateData,
    completedAt: certificateData.approvedAt,
  };

  return {
    success: true,
    status: 'completed',
    formationData,
    nextSteps: [
      'Complete payment to file the formation documents',
      'Receive your Certificate of Formation from Delaware',
      'Set up your company bank account',
      'Obtain your EIN from the IRS',
    ],
    message: 'Congratulations! Your company formation has been approved. Please proceed to payment to file with the Delaware Secretary of State.',
  };
};

// T043: Register certificate tools
export function registerCertificateTools(): void {
  registerTool(formationGenerateCertificateTool, handleFormationGenerateCertificate);
  registerTool(formationApproveCertificateTool, handleFormationApproveCertificate);
}
