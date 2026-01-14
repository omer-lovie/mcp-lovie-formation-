/**
 * Registered agent information prompts
 * FR-006: Conversational prompts
 * FR-007: Plain language explanations
 * FR-008: Input validation
 */

import inquirer from 'inquirer';
import { RegisteredAgent } from '../types';
import { validateName, validateAddress, validateEmail, validatePhone } from '../validators';
import { formatSubheader, formatProgress, print, formatInfo } from '../utils/formatter';

/**
 * Collect registered agent information
 */
export async function collectRegisteredAgentInfo(
  currentStep: number,
  totalSteps: number
): Promise<RegisteredAgent> {
  print(formatSubheader(formatProgress(currentStep, totalSteps, 'Registered Agent')));
  print(formatInfo('A registered agent receives legal documents on behalf of your company.\n'));
  print(formatInfo('This can be yourself, a business partner, or a registered agent service.\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is the registered agent\'s full name?',
      validate: (input: string) => {
        const result = validateName(input);
        return result.valid ? true : result.message || 'Invalid name';
      }
    },
    {
      type: 'input',
      name: 'address',
      message: 'What is the registered agent\'s physical address? (Must be in the state of incorporation)',
      validate: (input: string) => {
        const result = validateAddress(input);
        return result.valid ? true : result.message || 'Invalid address';
      }
    },
    {
      type: 'input',
      name: 'email',
      message: 'What is the registered agent\'s email address?',
      validate: (input: string) => {
        const result = validateEmail(input);
        return result.valid ? true : result.message || 'Invalid email';
      }
    },
    {
      type: 'input',
      name: 'phone',
      message: 'What is the registered agent\'s phone number?',
      validate: (input: string) => {
        const result = validatePhone(input);
        return result.valid ? true : result.message || 'Invalid phone';
      }
    }
  ]);

  return {
    name: answers.name.trim(),
    address: answers.address.trim(),
    contactInfo: {
      email: answers.email.trim(),
      phone: answers.phone.trim()
    }
  };
}
