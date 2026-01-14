/**
 * Company information prompts
 * FR-006: Conversational, interactive prompts
 * FR-007: Plain language explanations
 * FR-008: Real-time validation
 * FR-010: Keyboard navigation
 */

import inquirer from 'inquirer';
import { validateCompanyName } from '../validators';
import { formatSubheader, formatProgress, print } from '../utils/formatter';

export interface CompanyInfoResult {
  companyName: string;
  state: string;
  companyType: 'LLC' | 'C-Corp' | 'S-Corp';
}

const US_STATES = [
  'Delaware',
  'California',
  'Texas',
  'Florida',
  'New York',
  'Nevada',
  'Wyoming',
  '---',
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'Colorado', 'Connecticut',
  'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana',
  'Nebraska', 'New Hampshire', 'New Jersey', 'New Mexico',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin'
];

/**
 * Collect company name
 */
export async function askCompanyName(currentStep: number, totalSteps: number): Promise<string> {
  print(formatSubheader(formatProgress(currentStep, totalSteps, 'Company Name')));

  const { companyName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'companyName',
      message: 'What would you like to name your company?',
      validate: (input: string) => {
        const result = validateCompanyName(input);
        return result.valid ? true : result.message || 'Invalid company name';
      }
    }
  ]);

  return companyName.trim();
}

/**
 * Collect state of incorporation
 */
export async function askState(currentStep: number, totalSteps: number): Promise<string> {
  print(formatSubheader(formatProgress(currentStep, totalSteps, 'State of Incorporation')));
  print('💡 Tip: Delaware is popular for its business-friendly laws, but your home state might be simpler.\n');

  const { state } = await inquirer.prompt([
    {
      type: 'list',
      name: 'state',
      message: 'Where would you like to form your company?',
      choices: US_STATES,
      pageSize: 10,
      loop: false
    }
  ]);

  return state;
}

/**
 * Collect company type
 */
export async function askCompanyType(currentStep: number, totalSteps: number): Promise<'LLC' | 'C-Corp' | 'S-Corp'> {
  print(formatSubheader(formatProgress(currentStep, totalSteps, 'Company Type')));

  const { companyType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'companyType',
      message: 'What type of company would you like to form?',
      choices: [
        {
          name: 'LLC - Flexible structure, pass-through taxation (most popular for small businesses)',
          value: 'LLC'
        },
        {
          name: 'C-Corp - Best for venture capital, allows many shareholders and stock types',
          value: 'C-Corp'
        },
        {
          name: 'S-Corp - Tax advantages for profitable companies with limited shareholders',
          value: 'S-Corp'
        }
      ],
      loop: false
    }
  ]);

  return companyType;
}

/**
 * Collect all company information
 */
export async function collectCompanyInfo(): Promise<CompanyInfoResult> {
  const totalSteps = 8; // Total steps in the formation process

  const companyName = await askCompanyName(1, totalSteps);
  const state = await askState(2, totalSteps);
  const companyType = await askCompanyType(3, totalSteps);

  return {
    companyName,
    state,
    companyType
  };
}
