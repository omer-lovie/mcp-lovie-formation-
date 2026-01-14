/**
 * Welcome prompt and initial setup
 * FR-006: Conversational, interactive prompts
 * FR-007: Plain language, avoid jargon
 */

import inquirer from 'inquirer';
import { formatHeader, formatInfo, print } from '../utils/formatter';
import { hasExistingSession } from '../utils/session';

export interface WelcomeResult {
  action: 'new' | 'resume';
}

/**
 * Show welcome screen and check for existing sessions
 */
export async function showWelcome(): Promise<WelcomeResult> {
  // Show welcome message
  print(formatHeader('Welcome to Lovie! 🚀'));
  print(formatInfo('Let\'s help you form your company in just a few minutes.\n'));

  // Check for existing session
  if (hasExistingSession()) {
    const { resumeSession } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'resumeSession',
        message: 'We found an incomplete company formation. Would you like to continue where you left off?',
        default: true
      }
    ]);

    return {
      action: resumeSession ? 'resume' : 'new'
    };
  }

  return { action: 'new' };
}

/**
 * Show confirmation before starting fresh (when user has existing session)
 */
export async function confirmStartFresh(): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'This will discard your previous session. Are you sure you want to start fresh?',
      default: false
    }
  ]);

  return confirm;
}
