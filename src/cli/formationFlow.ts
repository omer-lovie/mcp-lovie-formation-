/**
 * Interactive company formation flow with async name checking
 *
 * Flow:
 * 1. Select State (Delaware only for now)
 * 2. Select Company Type (LLC, C-Corp, S-Corp)
 * 3. Select Entity Ending (based on type)
 * 4. Enter Company Base Name (show preview with ending)
 * 5. Collect Registered Agent Info (name check runs in background)
 * 6. Collect Share Structure (C-Corp/S-Corp only: authorized shares & par value)
 * 7. Collect Shareholder/Member Info
 * 8. Collect Authorized Party (who signs documents)
 * 9. Async notification when name check completes
 * 10. Review and Confirm
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { CompanyFormationData, CompanyType, USState, Shareholder, RegisteredAgent } from '../types';
import { Validators } from '../utils/validation';
import { createNameCheckAgent } from '../services/agents/NameCheckAgent';
import { reviewCertificateBeforePayment } from '../workflows/certificate-review';

/**
 * Entity endings by company type (from Delaware API docs)
 */
const ENTITY_ENDINGS: Record<CompanyType, string[]> = {
  'LLC': ['LLC', 'L.L.C.', 'Limited Liability Company'],
  'C-Corp': [
    'Inc.', 'Incorporated', 'Corp.', 'Corporation',
    'Company', 'Co.', 'Limited', 'Ltd.',
    'Association', 'Club', 'Foundation', 'Fund',
    'Institute', 'Society', 'Syndicate', 'Union'
  ],
  'S-Corp': [
    'Inc.', 'Incorporated', 'Corp.', 'Corporation',
    'Company', 'Co.', 'Limited', 'Ltd.'
  ]
};

/**
 * Available states (Delaware only for MVP)
 */
const AVAILABLE_STATES = [
  { name: 'Delaware (Only available state currently)', value: 'DE' }
];

/**
 * Company types with descriptions
 */
const COMPANY_TYPES = [
  {
    name: 'LLC - Limited Liability Company (Most popular for startups)',
    value: 'LLC',
    description: 'Flexible structure, pass-through taxation, limited liability'
  },
  {
    name: 'C-Corp - C Corporation (Best for venture funding)',
    value: 'C-Corp',
    description: 'Separate entity, double taxation, can issue multiple stock classes'
  },
  {
    name: 'S-Corp - S Corporation (Tax advantages for small businesses)',
    value: 'S-Corp',
    description: 'Pass-through taxation, limited to 100 shareholders, US residents only'
  }
];

interface FormationState {
  state: USState;
  companyType: CompanyType;
  entityEnding: string;
  baseName: string;
  fullCompanyName: string;
  nameCheckPending: boolean;
  nameCheckResult?: {
    available: boolean;
    reason?: string;
    suggestions?: string[];
  };
  registeredAgent?: RegisteredAgent;
  // C-Corp specific fields
  authorizedShares?: number;
  parValuePerShare?: number;
  // Shareholders
  shareholders: Shareholder[];
  // Authorized party (person who can sign documents)
  authorizedParty?: {
    name: string;
    title: string;
  };
}

/**
 * Display premium step header with gradient progress bar and animated transition
 */
async function displayStepHeader(current: number, total: number, icon: string, title: string): Promise<void> {
  const percentage = Math.round((current / total) * 100);
  const progressBarWidth = 40;
  const filled = Math.round((percentage / 100) * progressBarWidth);
  const empty = progressBarWidth - filled;

  // Brief loading animation for smooth transition
  if (current > 1) {
    const transitionSpinner = ora({
      text: chalk.hex('#9B59B6')('Preparing next step...'),
      color: 'magenta',
      spinner: {
        interval: 60,
        frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      }
    }).start();

    await new Promise(resolve => setTimeout(resolve, 400));
    transitionSpinner.stop();
  }

  // Create gradient progress bar
  let progressBar = '';
  for (let i = 0; i < filled; i++) {
    const progress = i / progressBarWidth;
    const colorValue = Math.round(46 + (progress * 113)); // 46 (2E) to 159 (9F)
    progressBar += chalk.hex(`#${colorValue.toString(16).padStart(2, '0')}CC71`)('█');
  }
  progressBar += chalk.dim('░'.repeat(empty));

  console.log();
  console.log(chalk.hex('#4A90E2')('   ╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.hex('#4A90E2')('   ║  ') + icon + '  ' + chalk.bold.hex('#9B59B6')(`STEP ${current}/${total}`) + chalk.gray(` • ${percentage}% Complete`) + '                    '.substring(0, 52 - (`${icon}  STEP ${current}/${total} • ${percentage}% Complete`).length) + chalk.hex('#4A90E2')('║'));
  console.log(chalk.hex('#4A90E2')('   ╟────────────────────────────────────────────────────────╢'));
  console.log(chalk.hex('#4A90E2')('   ║  ') + progressBar + '              '.substring(0, 54 - progressBarWidth) + chalk.hex('#4A90E2')('║'));
  console.log(chalk.hex('#4A90E2')('   ╟────────────────────────────────────────────────────────╢'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║   ') + chalk.bold.white(title.padEnd(52)) + chalk.hex('#4A90E2')('║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ╚════════════════════════════════════════════════════════╝'));
  console.log();
}

/**
 * Main formation flow
 */
export async function startFormationFlow(): Promise<CompanyFormationData | null> {
  console.clear();

  // Premium welcome banner with gradient
  console.log();
  console.log(chalk.hex('#4A90E2')('                                                              '));
  console.log(chalk.hex('#4A90E2')('   ╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('██╗     ') + chalk.bold.hex('#6CB4FF')('█████╗ ') + chalk.bold.hex('#7DC5FF')('██╗   ██╗') + chalk.bold.hex('#8ED6FF')('██╗') + chalk.bold.hex('#9FE7FF')('███████╗') + chalk.hex('#4A90E2')('     ║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('██║    ') + chalk.bold.hex('#6CB4FF')('██╔══██╗') + chalk.bold.hex('#7DC5FF')('██║   ██║') + chalk.bold.hex('#8ED6FF')('██║') + chalk.bold.hex('#9FE7FF')('██╔════╝') + chalk.hex('#4A90E2')('     ║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('██║    ') + chalk.bold.hex('#6CB4FF')('██║  ██║') + chalk.bold.hex('#7DC5FF')('██║   ██║') + chalk.bold.hex('#8ED6FF')('██║') + chalk.bold.hex('#9FE7FF')('█████╗  ') + chalk.hex('#4A90E2')('     ║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('██║    ') + chalk.bold.hex('#6CB4FF')('██║  ██║') + chalk.bold.hex('#7DC5FF')('╚██╗ ██╔╝') + chalk.bold.hex('#8ED6FF')('██║') + chalk.bold.hex('#9FE7FF')('██╔══╝  ') + chalk.hex('#4A90E2')('     ║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('███████╗') + chalk.bold.hex('#6CB4FF')('█████╔╝') + chalk.bold.hex('#7DC5FF')(' ╚████╔╝ ') + chalk.bold.hex('#8ED6FF')('██║') + chalk.bold.hex('#9FE7FF')('███████╗') + chalk.hex('#4A90E2')('     ║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.bold.hex('#5BA3FF')('╚══════╝') + chalk.bold.hex('#6CB4FF')('╚════╝ ') + chalk.bold.hex('#7DC5FF')('  ╚═══╝  ') + chalk.bold.hex('#8ED6FF')('╚═╝') + chalk.bold.hex('#9FE7FF')('╚══════╝') + chalk.hex('#4A90E2')('     ║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
  console.log(chalk.hex('#4A90E2')('   ║              ') + chalk.bold.hex('#9B59B6')('AI-First Banking & Finance') + chalk.hex('#4A90E2')('              ║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
  console.log(chalk.hex('#4A90E2')('   ╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
  console.log(chalk.hex('#4A90E2')('   ║       ') + chalk.hex('#2ECC71')('✨ ') + chalk.bold.white('Company Formation Made Simple') + chalk.hex('#2ECC71')(' ✨') + chalk.hex('#4A90E2')('        ║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
  console.log(chalk.hex('#4A90E2')('   ║       ') + chalk.dim('Form your Delaware company in minutes') + chalk.hex('#4A90E2')('        ║'));
  console.log(chalk.hex('#4A90E2')('   ║       ') + chalk.dim('Powered by AI, trusted by founders') + chalk.hex('#4A90E2')('         ║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                       ║'));
  console.log(chalk.hex('#4A90E2')('   ╚═══════════════════════════════════════════════════════╝'));
  console.log(chalk.hex('#4A90E2')('                                                              '));
  console.log();

  const state: FormationState = {
    state: 'DE',
    companyType: 'LLC',
    entityEnding: 'LLC',
    baseName: '',
    fullCompanyName: '',
    nameCheckPending: false,
    shareholders: []
  };

  try {
    // Calculate total steps based on company type
    const totalSteps = state.companyType === 'C-Corp' ? 9 : 8;
    let currentStep = 1;

    // Step 1: Select State
    await displayStepHeader(currentStep, totalSteps, '📍', 'Select State');
    await selectState(state);
    currentStep++;

    // Step 2: Select Company Type
    await displayStepHeader(currentStep, totalSteps, '🏛️', 'Select Company Type');
    await selectCompanyType(state);
    currentStep++;

    // Recalculate total steps after company type is selected
    const finalTotalSteps = state.companyType === 'C-Corp' || state.companyType === 'S-Corp' ? 9 : 8;

    // Step 3: Select Entity Ending
    await displayStepHeader(currentStep, finalTotalSteps, '📝', 'Select Entity Ending');
    await selectEntityEnding(state);
    currentStep++;

    // Step 4: Enter Company Name
    await displayStepHeader(currentStep, finalTotalSteps, '✏️', 'Enter Company Name');
    await enterCompanyName(state);
    currentStep++;

    // Step 5: Collect Registered Agent Information (name check starts in background)
    await displayStepHeader(currentStep, finalTotalSteps, '🏢', 'Registered Agent');
    console.log(chalk.hex('#4A90E2')('ℹ️  ') + chalk.gray('We\'ll check your company name availability in the background...\n'));

    // Start name check in background
    startBackgroundNameCheck(state);

    // Collect registered agent info while name check runs
    await collectRegisteredAgentInfo(state);
    currentStep++;

    // Step 6 (C-Corp only): Share Structure
    if (state.companyType === 'C-Corp' || state.companyType === 'S-Corp') {
      await displayStepHeader(currentStep, finalTotalSteps, '📊', 'Share Structure');
      await collectShareStructure(state);
      currentStep++;
    }

    // Step 7 (or 6 for LLC): Collect Shareholder Information
    await displayStepHeader(currentStep, finalTotalSteps, '👥', state.companyType === 'LLC' ? 'Members' : 'Shareholders');
    await collectShareholderInfo(state);
    currentStep++;

    // Step 8 (or 7 for LLC): Authorized Party
    await displayStepHeader(currentStep, finalTotalSteps, '✍️', 'Authorized Party');
    await collectAuthorizedParty(state);
    currentStep++;

    // Wait for name check to complete
    await waitForNameCheck(state);

    // If name unavailable or check failed, restart name selection
    if (!state.nameCheckResult?.available) {
      // Determine if it's an API error or actual unavailability
      const isApiError = state.nameCheckResult?.reason?.includes('Unable to') ||
                         state.nameCheckResult?.reason?.includes('timed out') ||
                         state.nameCheckResult?.reason?.includes('CAPTCHA') ||
                         !state.nameCheckResult?.reason;

      // Display error box
      console.log();
      console.log(chalk.hex('#E74C3C')('   ╔════════════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));

      if (isApiError) {
        console.log(chalk.hex('#E74C3C')('   ║     ') + chalk.bold.hex('#E74C3C')('⚠  NAME CHECK FAILED') + chalk.white('                             ║'));
      } else {
        console.log(chalk.hex('#E74C3C')('   ║     ') + chalk.bold.hex('#E74C3C')('✗  COMPANY NAME UNAVAILABLE') + chalk.white('                   ║'));
      }

      console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));

      if (state.nameCheckResult?.reason) {
        console.log(chalk.hex('#E74C3C')('   ╟────────────────────────────────────────────────────────╢'));
        console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
        // Wrap long reason text
        const reason = state.nameCheckResult.reason;
        const maxWidth = 48;
        const words = reason.split(' ');
        let line = '';

        for (const word of words) {
          if ((line + ' ' + word).length > maxWidth) {
            console.log(chalk.hex('#E74C3C')('   ║   ') + chalk.gray(line.padEnd(maxWidth)) + chalk.hex('#E74C3C')('║'));
            line = word;
          } else {
            line = line ? line + ' ' + word : word;
          }
        }
        if (line) {
          console.log(chalk.hex('#E74C3C')('   ║   ') + chalk.gray(line.padEnd(maxWidth)) + chalk.hex('#E74C3C')('║'));
        }

        console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
      }

      if (state.nameCheckResult?.suggestions && state.nameCheckResult.suggestions.length > 0) {
        console.log(chalk.hex('#E74C3C')('   ╟────────────────────────────────────────────────────────╢'));
        console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
        console.log(chalk.hex('#E74C3C')('   ║   ') + chalk.hex('#F39C12')('💡 Alternative suggestions:') + '                     '.substring(0, 48 - 27) + chalk.hex('#E74C3C')('║'));
        console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
        state.nameCheckResult.suggestions.slice(0, 3).forEach(s => {
          const truncated = s.length > 44 ? s.substring(0, 44) : s;
          console.log(chalk.hex('#E74C3C')('   ║     ') + chalk.white(`• ${truncated}`.padEnd(48)) + chalk.hex('#E74C3C')('║'));
        });
        console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
      }

      console.log(chalk.hex('#E74C3C')('   ╚════════════════════════════════════════════════════════╝'));
      console.log();

      // Ask user to try a different name
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: isApiError ? 'Would you like to try checking again?' : 'Would you like to try a different name?',
          default: true
        }
      ]);

      if (!retry) {
        console.log();
        console.log(chalk.hex('#F39C12')('⚠  ') + chalk.white('Formation cancelled.'));
        console.log();
        return null;
      }

      // Go back to company name step
      console.log();
      if (isApiError) {
        console.log(chalk.bold.white('🔄  Let\'s try checking that name again...'));
        console.log();
        // Use the same name for API retry
      } else {
        console.log(chalk.bold.white('✏️  Please enter a different company name'));
        console.log();
        await enterCompanyName(state);
      }

      // Start new name check
      startBackgroundNameCheck(state);
      await waitForNameCheck(state);

      // If still unavailable, give up
      if (!state.nameCheckResult?.available) {
        console.log();
        console.log(chalk.hex('#E74C3C')('   ╔════════════════════════════════════════════════════════╗'));
        console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
        console.log(chalk.hex('#E74C3C')('   ║     ') + chalk.bold.hex('#E74C3C')('✗  Unable to verify company name') + chalk.white('                ║'));
        console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
        console.log(chalk.hex('#E74C3C')('   ║     ') + chalk.dim('Please try again later or contact support') + chalk.hex('#E74C3C')('         ║'));
        console.log(chalk.hex('#E74C3C')('   ║                                                        ║'));
        console.log(chalk.hex('#E74C3C')('   ╚════════════════════════════════════════════════════════╝'));
        console.log();
        return null;
      }
    }

    // Premium success box for name availability
    console.log();
    console.log(chalk.hex('#2ECC71')('   ╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.hex('#2ECC71')('   ║                                                        ║'));
    console.log(chalk.hex('#2ECC71')('   ║     ') + chalk.bold.hex('#2ECC71')('✓  COMPANY NAME AVAILABLE') + chalk.white('                      ║'));
    console.log(chalk.hex('#2ECC71')('   ║                                                        ║'));
    console.log(chalk.hex('#2ECC71')('   ║     ') + chalk.dim('Your company name has been verified with the') + chalk.hex('#2ECC71')('      ║'));
    console.log(chalk.hex('#2ECC71')('   ║     ') + chalk.dim('Delaware Secretary of State and is ready to file!') + chalk.hex('#2ECC71')('  ║'));
    console.log(chalk.hex('#2ECC71')('   ║                                                        ║'));
    console.log(chalk.hex('#2ECC71')('   ╚════════════════════════════════════════════════════════╝'));
    console.log();

    // Final Step: Review and Confirm
    await displayStepHeader(currentStep, finalTotalSteps, '📋', 'Review Your Information');
    const confirmed = await reviewAndConfirm(state);

    if (!confirmed) {
      console.log();
      console.log(chalk.hex('#F39C12')('⚠  ') + chalk.white('Formation cancelled.'));
      console.log();
      return null;
    }

    // Build initial formation data for certificate review
    const formationData: CompanyFormationData = {
      companyName: state.fullCompanyName,
      state: state.state,
      companyType: state.companyType,
      shareholders: state.shareholders,
      registeredAgent: state.registeredAgent
    };

    // Add share structure for C-Corp/S-Corp
    if ((state.companyType === 'C-Corp' || state.companyType === 'S-Corp') && state.authorizedShares && state.parValuePerShare !== undefined) {
      // Note: These will be used in certificate generation
      // Store them in a way that can be accessed by certificate review
      (formationData as any).authorizedShares = state.authorizedShares;
      (formationData as any).parValue = state.parValuePerShare;
    }

    // Certificate Review Step
    currentStep++;
    await displayStepHeader(currentStep, finalTotalSteps + 1, '📜', 'Certificate Review');

    console.log(chalk.hex('#4A90E2')('ℹ️  ') + chalk.gray('Generating your certificate of incorporation for review...'));
    console.log(chalk.dim('💡 You\'ll be able to review the certificate in your browser before proceeding.\n'));

    const certificateResult = await reviewCertificateBeforePayment(formationData);

    // Handle certificate review result
    if (certificateResult.error) {
      console.log();
      console.log(chalk.hex('#E74C3C')('✗ ') + chalk.white('Certificate review failed'));
      console.log(chalk.dim(`   Error: ${certificateResult.error}`));
      console.log();

      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: 'Would you like to retry the certificate review?',
          default: true
        }
      ]);

      if (!retry) {
        console.log();
        console.log(chalk.hex('#F39C12')('⚠  ') + chalk.white('Formation cancelled.'));
        console.log();
        return null;
      }

      // Retry certificate review
      const retryResult = await reviewCertificateBeforePayment(formationData);
      if (!retryResult.approved) {
        console.log();
        console.log(chalk.hex('#E74C3C')('✗ ') + chalk.white('Certificate review failed after retry'));
        console.log();
        return null;
      }

      // Store certificate data
      (formationData as any).certificateData = retryResult.certificateData;
    } else if (certificateResult.cancelled) {
      console.log();
      const { goBack } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'goBack',
          message: 'Would you like to go back and review your information?',
          default: true
        }
      ]);

      if (!goBack) {
        console.log();
        console.log(chalk.hex('#F39C12')('⚠  ') + chalk.white('Formation cancelled.'));
        console.log();
        return null;
      }

      // Go back to review step
      currentStep--;
      const reconfirmed = await reviewAndConfirm(state);

      if (!reconfirmed) {
        console.log();
        console.log(chalk.hex('#F39C12')('⚠  ') + chalk.white('Formation cancelled.'));
        console.log();
        return null;
      }

      // Retry certificate review with updated data
      currentStep++;
      await displayStepHeader(currentStep, finalTotalSteps + 1, '📜', 'Certificate Review');
      const retryResult = await reviewCertificateBeforePayment(formationData);

      if (!retryResult.approved) {
        console.log();
        console.log(chalk.hex('#E74C3C')('✗ ') + chalk.white('Certificate review not approved'));
        console.log();
        return null;
      }

      // Store certificate data
      (formationData as any).certificateData = retryResult.certificateData;
    } else if (certificateResult.approved && certificateResult.certificateData) {
      // Store certificate data in formation data
      (formationData as any).certificateData = certificateResult.certificateData;

      console.log();
      console.log(chalk.hex('#2ECC71')('   ╔════════════════════════════════════════════════════════╗'));
      console.log(chalk.hex('#2ECC71')('   ║                                                        ║'));
      console.log(chalk.hex('#2ECC71')('   ║     ') + chalk.bold.hex('#2ECC71')('✓  CERTIFICATE APPROVED') + chalk.white('                          ║'));
      console.log(chalk.hex('#2ECC71')('   ║                                                        ║'));
      console.log(chalk.hex('#2ECC71')('   ║     ') + chalk.dim('Your certificate has been reviewed and approved!') + chalk.hex('#2ECC71')('     ║'));
      console.log(chalk.hex('#2ECC71')('   ║     ') + chalk.dim('Ready to proceed to payment.') + chalk.hex('#2ECC71')('                        ║'));
      console.log(chalk.hex('#2ECC71')('   ║                                                        ║'));
      console.log(chalk.hex('#2ECC71')('   ╚════════════════════════════════════════════════════════╝'));
      console.log();
    } else {
      // Unexpected state
      console.log();
      console.log(chalk.hex('#E74C3C')('✗ ') + chalk.white('Unexpected error in certificate review'));
      console.log();
      return null;
    }

    // Return completed formation data with certificate
    return formationData;

  } catch (error) {
    if (error instanceof Error && error.message === 'User force closed the prompt') {
      console.log(chalk.yellow('\n⚠️  Process interrupted. Run "lovie" to start again.\n'));
      return null;
    }
    throw error;
  }
}

/**
 * Step 1: Select State
 */
async function selectState(state: FormationState): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'state',
      message: 'In which state would you like to incorporate?',
      choices: AVAILABLE_STATES,
      default: 'DE'
    }
  ]);

  state.state = answers.state;
  console.log(chalk.gray(`Selected: ${state.state} (Delaware)\n`));
}

/**
 * Step 2: Select Company Type
 */
async function selectCompanyType(state: FormationState): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'companyType',
      message: 'What type of company do you want to form?',
      choices: COMPANY_TYPES.map(ct => ({
        name: ct.name,
        value: ct.value
      })),
      default: 'LLC'
    }
  ]);

  state.companyType = answers.companyType;

  // Show description
  const selected = COMPANY_TYPES.find(ct => ct.value === state.companyType);
  if (selected) {
    console.log(chalk.gray(`\n${selected.description}\n`));
  }
}

/**
 * Step 3: Select Entity Ending
 */
async function selectEntityEnding(state: FormationState): Promise<void> {
  const endings = ENTITY_ENDINGS[state.companyType];

  console.log(chalk.gray(`Available endings for ${state.companyType}:\n`));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'entityEnding',
      message: 'Select your preferred entity ending:',
      choices: endings,
      default: endings[0],
      pageSize: 10
    }
  ]);

  state.entityEnding = answers.entityEnding;
  console.log(chalk.gray(`Selected: ${state.entityEnding}\n`));
}

/**
 * Step 4: Enter Company Name
 */
async function enterCompanyName(state: FormationState): Promise<void> {
  console.log(chalk.cyan(`Your company name will end with: ${chalk.bold(state.entityEnding)}`));
  console.log(chalk.gray('Please enter the base name only (we\'ll add the ending automatically)\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'baseName',
      message: 'Enter your company base name:',
      validate: (input: string) => {
        // Strip any entity endings automatically
        let cleanedInput = input.trim();
        for (const ending of ENTITY_ENDINGS[state.companyType]) {
          const regex = new RegExp(`\\s*${ending.replace(/\./g, '\\.')}\\s*$`, 'i');
          cleanedInput = cleanedInput.replace(regex, '').trim();
        }

        if (!cleanedInput || cleanedInput.length < 3) {
          return 'Company name must be at least 3 characters';
        }
        if (cleanedInput.length > 200) {
          return 'Company name is too long (max 200 characters for base name)';
        }
        return true;
      },
      transformer: (input: string) => {
        // Show preview with ending
        return input ? `${input} ${chalk.dim(state.entityEnding)}` : '';
      }
    }
  ]);

  // Strip any entity endings from the input automatically
  let cleanedBaseName = answers.baseName.trim();
  for (const ending of ENTITY_ENDINGS[state.companyType]) {
    const regex = new RegExp(`\\s*${ending.replace(/\./g, '\\.')}\\s*$`, 'i');
    cleanedBaseName = cleanedBaseName.replace(regex, '').trim();
  }

  state.baseName = cleanedBaseName;
  state.fullCompanyName = `${state.baseName} ${state.entityEnding}`;

  console.log();
  console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white(`Full company name: ${chalk.bold(state.fullCompanyName)}`));
  console.log();
}

/**
 * Start background name check
 */
function startBackgroundNameCheck(state: FormationState): void {
  state.nameCheckPending = true;

  const agent = createNameCheckAgent();

  // Run name check in background (don't await)
  agent.checkAvailability({
    companyName: state.fullCompanyName,
    state: state.state,
    companyType: state.companyType
  })
    .then(result => {
      state.nameCheckResult = {
        available: result.available,
        reason: result.reason,
        suggestions: result.suggestions
      };
      state.nameCheckPending = false;
    })
    .catch(error => {
      // Store error without logging (will be shown in waitForNameCheck)
      state.nameCheckResult = {
        available: false,
        reason: error.message || 'Unable to verify name availability'
      };
      state.nameCheckPending = false;
    });
}

/**
 * Wait for name check to complete with premium loading animation
 */
async function waitForNameCheck(state: FormationState): Promise<void> {
  // If check already completed, just show the result
  if (!state.nameCheckPending && state.nameCheckResult) {
    console.log();
    if (state.nameCheckResult.available) {
      console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white('Company name is available!'));
    } else {
      console.log(chalk.hex('#E74C3C')('✗ ') + chalk.white('Company name check failed'));
    }
    return;
  }

  const spinner = ora({
    text: chalk.hex('#4A90E2')('Checking name availability with Delaware Secretary of State...'),
    color: 'cyan',
    spinner: {
      interval: 80,
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    }
  }).start();

  let dots = 0;
  const checkInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    spinner.text = chalk.hex('#4A90E2')('Checking name availability with Delaware Secretary of State') + '.'.repeat(dots);
  }, 500);

  // Poll until complete
  while (state.nameCheckPending) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  clearInterval(checkInterval);

  // Check if we have a result
  if (!state.nameCheckResult) {
    spinner.stopAndPersist({
      symbol: chalk.hex('#E74C3C')('✗'),
      text: chalk.white('Name check failed - no response received')
    });
    return;
  }

  if (state.nameCheckResult.available) {
    spinner.stopAndPersist({
      symbol: chalk.hex('#2ECC71')('✓'),
      text: chalk.white('Company name is available!')
    });
  } else {
    // Show error message from API
    spinner.stopAndPersist({
      symbol: chalk.hex('#E74C3C')('✗'),
      text: chalk.white(state.nameCheckResult.reason || 'Company name is not available')
    });
  }
}

/**
 * Collect shareholder information
 */
async function collectShareholderInfo(state: FormationState): Promise<void> {
  const { numShareholders } = await inquirer.prompt([
    {
      type: 'number',
      name: 'numShareholders',
      message: `How many ${state.companyType === 'LLC' ? 'members' : 'shareholders'} will your company have?`,
      default: 1,
      validate: (input: number) => {
        if (input < 1) return 'Must have at least one';
        if (input > 100) return 'Maximum 100 allowed';
        return true;
      }
    }
  ]);

  for (let i = 0; i < numShareholders; i++) {
    console.log(chalk.cyan(`\n${state.companyType === 'LLC' ? 'Member' : 'Shareholder'} ${i + 1} of ${numShareholders}:`));

    const shareholder = await inquirer.prompt([
      {
        type: 'input',
        name: 'firstName',
        message: 'First name:',
        validate: (input: string) => input.trim().length > 0 || 'Required'
      },
      {
        type: 'input',
        name: 'lastName',
        message: 'Last name:',
        validate: (input: string) => input.trim().length > 0 || 'Required'
      },
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input: string) => {
          const result = Validators.email(input);
          return result.isValid || result.error || 'Invalid email';
        }
      },
      {
        type: 'input',
        name: 'ownershipPercentage',
        message: 'Ownership percentage:',
        default: numShareholders === 1 ? '100' : '',
        validate: (input: string) => {
          const num = parseFloat(input);
          if (isNaN(num) || num <= 0 || num > 100) {
            return 'Must be between 0 and 100';
          }
          return true;
        },
        transformer: (input: string) => input ? `${input}%` : ''
      }
    ]);

    state.shareholders.push({
      firstName: shareholder.firstName,
      lastName: shareholder.lastName,
      email: shareholder.email,
      phone: '', // Collect later if needed
      ownershipPercentage: parseFloat(shareholder.ownershipPercentage),
      address: {
        street1: '',
        city: '',
        state: 'DE',
        zipCode: '',
        country: 'US'
      }
    } as Shareholder);
  }

  console.log();
  console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white(`${numShareholders} ${state.companyType === 'LLC' ? 'member(s)' : 'shareholder(s)'} added`));
  console.log();
}

/**
 * Collect registered agent information
 */
async function collectRegisteredAgentInfo(state: FormationState): Promise<void> {
  console.log(chalk.dim('   💡 A registered agent receives legal documents on behalf of your company.\n'));

  // Premium recommendation box with shadow effect
  console.log(chalk.hex('#2ECC71')('   ╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.hex('#2ECC71')('   ║ ') + chalk.bold.hex('#2ECC71')('⭐ RECOMMENDED PARTNER') + chalk.white(' • Save $125 First Year'.padEnd(31)) + chalk.hex('#2ECC71')('║'));
  console.log(chalk.hex('#2ECC71')('   ╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.hex('#2ECC71')('   ║                                                       ║'));
  console.log(chalk.hex('#2ECC71')('   ║   ') + chalk.bold.white('Harvard Business Services, Inc.'.padEnd(49)) + chalk.hex('#2ECC71')('║'));
  console.log(chalk.hex('#2ECC71')('   ║   ') + chalk.dim('Delaware\'s Most Trusted Registered Agent'.padEnd(49)) + chalk.hex('#2ECC71')('║'));
  console.log(chalk.hex('#2ECC71')('   ║                                                       ║'));
  console.log(chalk.hex('#2ECC71')('   ╟───────────────────────────────────────────────────────╢'));
  console.log(chalk.hex('#2ECC71')('   ║                                                       ║'));
  console.log(chalk.hex('#2ECC71')('   ║   ') + chalk.hex('#2ECC71')('✓ ') + chalk.white('First year FREE (normally $125)'.padEnd(47)) + chalk.hex('#2ECC71')('║'));
  console.log(chalk.hex('#2ECC71')('   ║   ') + chalk.hex('#2ECC71')('✓ ') + chalk.white('Only $60/year after that'.padEnd(47)) + chalk.hex('#2ECC71')('║'));
  console.log(chalk.hex('#2ECC71')('   ║   ') + chalk.hex('#2ECC71')('✓ ') + chalk.white('Instant document scanning & email alerts'.padEnd(47)) + chalk.hex('#2ECC71')('║'));
  console.log(chalk.hex('#2ECC71')('   ║   ') + chalk.hex('#2ECC71')('✓ ') + chalk.white('Physical mail forwarding included'.padEnd(47)) + chalk.hex('#2ECC71')('║'));
  console.log(chalk.hex('#2ECC71')('   ║   ') + chalk.hex('#2ECC71')('✓ ') + chalk.white('40+ years serving Delaware businesses'.padEnd(47)) + chalk.hex('#2ECC71')('║'));
  console.log(chalk.hex('#2ECC71')('   ║                                                       ║'));
  console.log(chalk.hex('#2ECC71')('   ╚═══════════════════════════════════════════════════════╝'));
  console.log(chalk.dim('    └─ Used by 50,000+ companies including Y Combinator startups'));
  console.log();

  const { useRecommended } = await inquirer.prompt([
    {
      type: 'list',
      name: 'useRecommended',
      message: 'Would you like to use our recommended registered agent?',
      choices: [
        { name: 'Yes - Use Harvard Business Services (First year FREE)', value: true },
        { name: 'No - I\'ll provide my own registered agent', value: false }
      ],
      default: true
    }
  ]);

  if (useRecommended) {
    // Use recommended agent
    state.registeredAgent = {
      name: 'Harvard Business Services, Inc.',
      email: 'orders@delawareinc.com',
      phone: '1-800-345-2677',
      isIndividual: false,
      address: {
        street1: '16192 Coastal Highway',
        city: 'Lewes',
        state: 'DE',
        zipCode: '19958',
        country: 'US'
      }
    };

    console.log();
    console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white('Registered agent configured: Harvard Business Services, Inc.'));
    console.log(chalk.dim('   16192 Coastal Highway, Lewes, DE 19958'));
    console.log();
  } else {
    // Collect custom agent information
    console.log(chalk.yellow('\n📝 Please provide your registered agent details:\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Registered agent name:',
        validate: (input: string) => input.trim().length > 0 || 'Required'
      },
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input: string) => {
          const result = Validators.email(input);
          return result.isValid || result.error || 'Invalid email';
        }
      },
      {
        type: 'input',
        name: 'phone',
        message: 'Phone:',
        validate: (input: string) => {
          const result = Validators.phone(input);
          return result.isValid || result.error || 'Invalid phone';
        }
      },
      {
        type: 'input',
        name: 'street',
        message: 'Street address (no P.O. boxes):',
        validate: (input: string) => {
          if (input.toLowerCase().includes('p.o. box') || input.toLowerCase().includes('po box')) {
            return 'P.O. Box addresses are not allowed for registered agents';
          }
          const result = Validators.streetAddress(input);
          return result.isValid || result.error || 'Invalid address';
        }
      },
      {
        type: 'input',
        name: 'city',
        message: 'City:',
        validate: (input: string) => {
          const result = Validators.city(input);
          return result.isValid || result.error || 'Invalid city';
        }
      },
      {
        type: 'list',
        name: 'state',
        message: 'State:',
        choices: [
          { name: 'Delaware (DE)', value: 'DE' },
          { name: 'Other state', value: 'other' }
        ],
        default: 'DE'
      },
      {
        type: 'input',
        name: 'zipCode',
        message: 'ZIP code:',
        validate: (input: string) => {
          const result = Validators.zipCode(input);
          return result.isValid || result.error || 'Invalid ZIP code';
        }
      },
      {
        type: 'input',
        name: 'county',
        message: 'County:',
        default: 'Sussex',
        validate: (input: string) => input.trim().length > 0 || 'County is required'
      }
    ]);

    state.registeredAgent = {
      name: answers.name,
      email: answers.email,
      phone: answers.phone,
      isIndividual: false,
      address: {
        street1: answers.street,
        city: answers.city,
        state: answers.state === 'other' ? 'DE' : answers.state,
        zipCode: answers.zipCode,
        country: 'US'
      }
    };

    console.log();
    console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white('Registered agent information saved'));
    console.log(chalk.dim(`   ${answers.name}`));
    console.log(chalk.dim(`   ${answers.street}, ${answers.city}, ${answers.state} ${answers.zipCode}`));
    console.log();
  }
}

/**
 * Collect share structure (C-Corp and S-Corp only)
 */
async function collectShareStructure(state: FormationState): Promise<void> {
  console.log(chalk.dim('   💡 Define the capital structure of your corporation.\n'));

  // Premium Silicon Valley structure recommendation
  console.log(chalk.hex('#9B59B6')('   ╔═══════════════════════════════════════════════════════╗'));
  console.log(chalk.hex('#9B59B6')('   ║ ') + chalk.bold.hex('#9B59B6')('💎 SILICON VALLEY STANDARD') + chalk.white(' • Investor Ready'.padEnd(25)) + chalk.hex('#9B59B6')('║'));
  console.log(chalk.hex('#9B59B6')('   ╠═══════════════════════════════════════════════════════╣'));
  console.log(chalk.hex('#9B59B6')('   ║                                                       ║'));
  console.log(chalk.hex('#9B59B6')('   ║   ') + chalk.bold.white('Preferred by Top VCs & Accelerators'.padEnd(49)) + chalk.hex('#9B59B6')('║'));
  console.log(chalk.hex('#9B59B6')('   ║                                                       ║'));
  console.log(chalk.hex('#9B59B6')('   ╟───────────────────────────────────────────────────────╢'));
  console.log(chalk.hex('#9B59B6')('   ║                                                       ║'));
  console.log(chalk.hex('#9B59B6')('   ║   ') + chalk.hex('#2ECC71')('◆ ') + chalk.white('10,000,000 shares') + chalk.dim(' of Common Stock'.padEnd(33)) + chalk.hex('#9B59B6')('║'));
  console.log(chalk.hex('#9B59B6')('   ║   ') + chalk.hex('#2ECC71')('◆ ') + chalk.white('$0.00001 par value') + chalk.dim(' per share'.padEnd(31)) + chalk.hex('#9B59B6')('║'));
  console.log(chalk.hex('#9B59B6')('   ║                                                       ║'));
  console.log(chalk.hex('#9B59B6')('   ║   ') + chalk.dim('This structure provides maximum flexibility for'.padEnd(49)) + chalk.hex('#9B59B6')('║'));
  console.log(chalk.hex('#9B59B6')('   ║   ') + chalk.dim('future fundraising and equity compensation.'.padEnd(49)) + chalk.hex('#9B59B6')('║'));
  console.log(chalk.hex('#9B59B6')('   ║                                                       ║'));
  console.log(chalk.hex('#9B59B6')('   ╚═══════════════════════════════════════════════════════╝'));
  console.log(chalk.dim('    └─ Used by 90% of YC companies and venture-backed startups'));
  console.log();

  const { useStandard } = await inquirer.prompt([
    {
      type: 'list',
      name: 'useStandard',
      message: 'Would you like to use the standard Silicon Valley structure?',
      choices: [
        { name: 'Yes - Use standard structure (10M shares @ $0.00001)', value: true },
        { name: 'No - I\'ll customize the share structure', value: false }
      ],
      default: true
    }
  ]);

  if (useStandard) {
    // Use standard structure
    state.authorizedShares = 10000000;
    state.parValuePerShare = 0.00001;

    console.log();
    console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white('Share structure configured (Standard Silicon Valley)'));
    console.log(chalk.dim('   10,000,000 shares authorized'));
    console.log(chalk.dim('   $0.00001 par value per share'));
    console.log();
  } else {
    // Collect custom structure
    console.log(chalk.yellow('\n📝 Please provide your custom share structure:\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'authorizedShares',
        message: 'Number of authorized shares:',
        default: '10000000',
        validate: (input: string) => {
          const num = parseInt(input.replace(/,/g, ''));
          if (isNaN(num) || num < 1) {
            return 'Must be a positive number';
          }
          if (num > 1000000000) {
            return 'Maximum 1 billion shares';
          }
          return true;
        },
        transformer: (input: string) => {
          const num = parseInt(input.replace(/,/g, ''));
          if (isNaN(num)) return input;
          return num.toLocaleString();
        }
      },
      {
        type: 'input',
        name: 'parValue',
        message: 'Par value per share (in dollars):',
        default: '0.00001',
        validate: (input: string) => {
          const num = parseFloat(input);
          if (isNaN(num) || num < 0) {
            return 'Must be a positive number or zero';
          }
          if (num > 1000) {
            return 'Par value seems too high (usually under $1)';
          }
          return true;
        },
        transformer: (input: string) => {
          const num = parseFloat(input);
          if (isNaN(num)) return input;
          return `$${num.toFixed(5)}`;
        }
      }
    ]);

    state.authorizedShares = parseInt(answers.authorizedShares.replace(/,/g, ''));
    state.parValuePerShare = parseFloat(answers.parValue);

    console.log();
    console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white('Custom share structure configured'));
    console.log(chalk.dim(`   ${state.authorizedShares.toLocaleString()} shares authorized`));
    console.log(chalk.dim(`   $${state.parValuePerShare.toFixed(5)} par value per share`));
    console.log();
  }
}

/**
 * Collect authorized party (person authorized to sign documents)
 */
async function collectAuthorizedParty(state: FormationState): Promise<void> {
  console.log(chalk.hex('#4A90E2')('ℹ️  ') + chalk.gray('Who is authorized to sign formation documents on behalf of the company?'));
  console.log(chalk.dim('💡 This is typically a founder, CEO, or managing member.\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Authorized party name:',
      validate: (input: string) => {
        if (!input || input.trim().length < 2) {
          return 'Please enter a full name';
        }
        const words = input.trim().split(/\s+/);
        if (words.length < 2) {
          return 'Please enter first and last name';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'title',
      message: 'Title/Position:',
      default: state.companyType === 'LLC' ? 'Managing Member' : 'President',
      validate: (input: string) => input.trim().length > 0 || 'Title is required'
    }
  ]);

  state.authorizedParty = {
    name: answers.name,
    title: answers.title
  };

  console.log();
  console.log(chalk.hex('#2ECC71')('✓ ') + chalk.white(`Authorized party: ${answers.name} (${answers.title})`));
  console.log();
}

/**
 * Review and confirm all information
 */
async function reviewAndConfirm(state: FormationState): Promise<boolean> {
  const maxWidth = 56;

  // Premium review box with better formatting
  console.log();
  console.log(chalk.hex('#4A90E2')('   ╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║          ') + chalk.bold.white('REVIEW YOUR FORMATION DETAILS') + chalk.hex('#4A90E2')('                 ║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ╠════════════════════════════════════════════════════════╣'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));

  // Company Details with icon
  console.log(chalk.hex('#4A90E2')('   ║  ') + chalk.bold.hex('#9B59B6')('🏢  Company Information') + '                              '.substring(0, maxWidth - 24) + chalk.hex('#4A90E2')('║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.dim('Name:     ') + chalk.bold.white(state.fullCompanyName.substring(0, 38).padEnd(38)) + chalk.hex('#4A90E2')('║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.dim('Type:     ') + chalk.white(state.companyType.padEnd(38)) + chalk.hex('#4A90E2')('║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.dim('State:    ') + chalk.white(state.state.padEnd(38)) + chalk.hex('#4A90E2')('║'));

  // Registered Agent with better formatting
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║  ') + chalk.bold.hex('#9B59B6')('📮  Registered Agent') + '                                  '.substring(0, maxWidth - 22) + chalk.hex('#4A90E2')('║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.white((state.registeredAgent?.name || '').substring(0, 43).padEnd(43)) + chalk.hex('#4A90E2')('║'));
  if (state.registeredAgent?.address) {
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.dim(state.registeredAgent.address.street1.substring(0, 43).padEnd(43)) + chalk.hex('#4A90E2')('║'));
    const cityLine = `${state.registeredAgent.address.city}, ${state.registeredAgent.address.state} ${state.registeredAgent.address.zipCode}`;
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.dim(cityLine.substring(0, 43).padEnd(43)) + chalk.hex('#4A90E2')('║'));
  }

  // Share Structure (if applicable)
  if (state.authorizedShares && state.parValuePerShare !== undefined) {
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ║  ') + chalk.bold.hex('#9B59B6')('📊  Share Structure') + '                                   '.substring(0, maxWidth - 21) + chalk.hex('#4A90E2')('║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.dim('Authorized: ') + chalk.white(state.authorizedShares.toLocaleString().padEnd(36)) + chalk.hex('#4A90E2')('║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.dim('Par Value:  ') + chalk.white(`$${state.parValuePerShare.toFixed(5)}`.padEnd(36)) + chalk.hex('#4A90E2')('║'));
  }

  // Shareholders/Members
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  const memberLabel = state.companyType === 'LLC' ? '👥  Members' : '👥  Shareholders';
  console.log(chalk.hex('#4A90E2')('   ║  ') + chalk.bold.hex('#9B59B6')(memberLabel.padEnd(maxWidth - 2)) + chalk.hex('#4A90E2')('║'));
  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  state.shareholders.forEach((s, i) => {
    const name = `${s.firstName} ${s.lastName}`;
    const ownership = chalk.hex('#2ECC71')(`${s.ownershipPercentage}%`);
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.white(name.substring(0, 33).padEnd(33)) + ' ' + ownership + '          '.substring(0, 10 - ownership.length) + chalk.hex('#4A90E2')('║'));
  });

  // Authorized Party
  if (state.authorizedParty) {
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ║  ') + chalk.bold.hex('#9B59B6')('✍️  Authorized Party') + '                                  '.substring(0, maxWidth - 22) + chalk.hex('#4A90E2')('║'));
    console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.white(`${state.authorizedParty.name}`.substring(0, 43).padEnd(43)) + chalk.hex('#4A90E2')('║'));
    console.log(chalk.hex('#4A90E2')('   ║     ') + chalk.dim(`${state.authorizedParty.title}`.substring(0, 43).padEnd(43)) + chalk.hex('#4A90E2')('║'));
  }

  console.log(chalk.hex('#4A90E2')('   ║                                                        ║'));
  console.log(chalk.hex('#4A90E2')('   ╚════════════════════════════════════════════════════════╝'));
  console.log();

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Is this information correct?',
      default: true
    }
  ]);

  return confirmed;
}
