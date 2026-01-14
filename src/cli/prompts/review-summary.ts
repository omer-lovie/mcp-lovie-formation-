/**
 * Review and summary prompts
 * FR-012: Allow users to go back and edit
 * FR-016: Display summary before payment
 * FR-017: Allow editing any field
 */

import inquirer from 'inquirer';
import { CompanyFormationData } from '../types';
import {
  formatHeader,
  formatSummary,
  formatSubheader,
  formatProgress,
  print,
  colors
} from '../utils/formatter';

export type EditField =
  | 'company-name'
  | 'state'
  | 'company-type'
  | 'shareholders'
  | 'registered-agent'
  | 'none';

/**
 * Display summary of all collected information
 */
export function displaySummary(data: CompanyFormationData): void {
  print(formatHeader('Review Your Information'));

  // Company details
  print(formatSubheader('Company Details'));
  print(formatSummary([
    { label: 'Company Name', value: data.companyName },
    { label: 'State', value: data.state },
    { label: 'Company Type', value: data.companyType }
  ]));

  // Shareholders/Members
  const entityType = data.companyType === 'LLC' ? 'Members' : 'Shareholders';
  print(formatSubheader(`\n${entityType}`));
  data.shareholders.forEach((shareholder, index) => {
    print(`\n${colors.bold(`${entityType.slice(0, -1)} #${index + 1}:`)}`);
    print(formatSummary([
      { label: '  Name', value: shareholder.name },
      { label: '  Address', value: shareholder.address },
      { label: '  Ownership', value: `${shareholder.ownershipPercentage}%` },
      {
        label: '  Tax ID',
        value: shareholder.ssn ? 'SSN (encrypted)' : shareholder.ein ? `EIN: ${shareholder.ein}` : 'Not provided'
      }
    ]));
  });

  // Registered Agent
  print(formatSubheader('\nRegistered Agent'));
  print(formatSummary([
    { label: 'Name', value: data.registeredAgent.name },
    { label: 'Address', value: data.registeredAgent.address },
    { label: 'Email', value: data.registeredAgent.contactInfo.email },
    { label: 'Phone', value: data.registeredAgent.contactInfo.phone }
  ]));

  print(''); // Empty line for spacing
}

/**
 * Ask user to review and confirm or edit
 */
export async function reviewAndConfirm(
  data: CompanyFormationData,
  currentStep: number,
  totalSteps: number
): Promise<{ confirmed: boolean; editField?: EditField }> {
  print(formatSubheader(formatProgress(currentStep, totalSteps, 'Review & Confirm')));

  displaySummary(data);

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '✓ Everything looks good, continue to payment', value: 'confirm' },
        { name: '✎ Edit company name', value: 'company-name' },
        { name: '✎ Edit state of incorporation', value: 'state' },
        { name: '✎ Edit company type', value: 'company-type' },
        { name: '✎ Edit shareholders/members', value: 'shareholders' },
        { name: '✎ Edit registered agent', value: 'registered-agent' },
        { name: '✗ Cancel and exit', value: 'cancel' }
      ],
      loop: false
    }
  ]);

  if (action === 'confirm') {
    return { confirmed: true };
  }

  if (action === 'cancel') {
    const { confirmCancel } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmCancel',
        message: 'Are you sure you want to cancel? Your progress will be saved.',
        default: false
      }
    ]);

    if (confirmCancel) {
      return { confirmed: false, editField: 'none' };
    }

    // If they don't confirm cancellation, show the review again
    return reviewAndConfirm(data, currentStep, totalSteps);
  }

  return { confirmed: false, editField: action as EditField };
}
