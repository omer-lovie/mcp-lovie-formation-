/**
 * Interactive prompts for company formation flow
 * Uses inquirer for conversational interface
 */

import inquirer from 'inquirer';
import { Validators } from '../utils/validation';
import { CompanyType, USState, Shareholder, RegisteredAgent, Address } from '../types';

export class Prompts {
  /**
   * Company name prompt with validation
   */
  static async companyName(): Promise<string> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'What would you like to name your company?',
        validate: (input: string) => {
          const result = Validators.companyName(input);
          return result.isValid || result.error || 'Invalid company name';
        }
      }
    ]);

    return answers.name;
  }

  /**
   * State selection prompt
   */
  static async state(): Promise<USState> {
    const states = [
      { name: 'Delaware (most popular for startups)', value: 'DE' },
      { name: 'California', value: 'CA' },
      { name: 'New York', value: 'NY' },
      { name: 'Texas', value: 'TX' },
      { name: 'Florida', value: 'FL' },
      new inquirer.Separator(),
      { name: 'See all states...', value: 'all' }
    ];

    const initial = await inquirer.prompt([
      {
        type: 'list',
        name: 'state',
        message: 'In which state would you like to incorporate?',
        choices: states,
        pageSize: 8
      }
    ]);

    if (initial.state === 'all') {
      // Show all 50 states
      const allStates = [
        { name: 'Alabama (AL)', value: 'AL' },
        { name: 'Alaska (AK)', value: 'AK' },
        { name: 'Arizona (AZ)', value: 'AZ' },
        { name: 'Arkansas (AR)', value: 'AR' },
        { name: 'California (CA)', value: 'CA' },
        { name: 'Colorado (CO)', value: 'CO' },
        { name: 'Connecticut (CT)', value: 'CT' },
        { name: 'Delaware (DE)', value: 'DE' },
        { name: 'Florida (FL)', value: 'FL' },
        { name: 'Georgia (GA)', value: 'GA' },
        { name: 'Hawaii (HI)', value: 'HI' },
        { name: 'Idaho (ID)', value: 'ID' },
        { name: 'Illinois (IL)', value: 'IL' },
        { name: 'Indiana (IN)', value: 'IN' },
        { name: 'Iowa (IA)', value: 'IA' },
        { name: 'Kansas (KS)', value: 'KS' },
        { name: 'Kentucky (KY)', value: 'KY' },
        { name: 'Louisiana (LA)', value: 'LA' },
        { name: 'Maine (ME)', value: 'ME' },
        { name: 'Maryland (MD)', value: 'MD' },
        { name: 'Massachusetts (MA)', value: 'MA' },
        { name: 'Michigan (MI)', value: 'MI' },
        { name: 'Minnesota (MN)', value: 'MN' },
        { name: 'Mississippi (MS)', value: 'MS' },
        { name: 'Missouri (MO)', value: 'MO' },
        { name: 'Montana (MT)', value: 'MT' },
        { name: 'Nebraska (NE)', value: 'NE' },
        { name: 'Nevada (NV)', value: 'NV' },
        { name: 'New Hampshire (NH)', value: 'NH' },
        { name: 'New Jersey (NJ)', value: 'NJ' },
        { name: 'New Mexico (NM)', value: 'NM' },
        { name: 'New York (NY)', value: 'NY' },
        { name: 'North Carolina (NC)', value: 'NC' },
        { name: 'North Dakota (ND)', value: 'ND' },
        { name: 'Ohio (OH)', value: 'OH' },
        { name: 'Oklahoma (OK)', value: 'OK' },
        { name: 'Oregon (OR)', value: 'OR' },
        { name: 'Pennsylvania (PA)', value: 'PA' },
        { name: 'Rhode Island (RI)', value: 'RI' },
        { name: 'South Carolina (SC)', value: 'SC' },
        { name: 'South Dakota (SD)', value: 'SD' },
        { name: 'Tennessee (TN)', value: 'TN' },
        { name: 'Texas (TX)', value: 'TX' },
        { name: 'Utah (UT)', value: 'UT' },
        { name: 'Vermont (VT)', value: 'VT' },
        { name: 'Virginia (VA)', value: 'VA' },
        { name: 'Washington (WA)', value: 'WA' },
        { name: 'West Virginia (WV)', value: 'WV' },
        { name: 'Wisconsin (WI)', value: 'WI' },
        { name: 'Wyoming (WY)', value: 'WY' }
      ];

      const fullSelection = await inquirer.prompt([
        {
          type: 'list',
          name: 'state',
          message: 'Select your state:',
          choices: allStates,
          pageSize: 15
        }
      ]);

      return fullSelection.state;
    }

    return initial.state;
  }

  /**
   * Company type selection
   */
  static async companyType(): Promise<CompanyType> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What type of company would you like to form?',
        choices: [
          {
            name: 'LLC - Limited Liability Company (flexible, simple taxes)',
            value: 'llc',
            short: 'LLC'
          },
          {
            name: 'C-Corp - C Corporation (best for raising venture capital)',
            value: 'c-corp',
            short: 'C-Corp'
          },
          {
            name: 'S-Corp - S Corporation (pass-through taxation, ownership restrictions)',
            value: 's-corp',
            short: 'S-Corp'
          }
        ],
        pageSize: 5
      }
    ]);

    return answers.type;
  }

  /**
   * Number of shareholders/members
   */
  static async numberOfShareholders(): Promise<number> {
    const answers = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: 'How many owners/shareholders will there be?',
        default: 1,
        validate: (input: number) => {
          if (input < 1) return 'Must have at least 1 owner';
          if (input > 100) return 'Maximum 100 owners allowed';
          return true;
        }
      }
    ]);

    return answers.count;
  }

  /**
   * Shareholder information
   */
  static async shareholderInfo(index: number, totalCount: number): Promise<Shareholder> {
    console.log(`\nOwner ${index + 1} of ${totalCount}`);

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Full legal name:',
        validate: (input: string) => {
          const result = Validators.personName(input);
          return result.isValid || result.error || 'Invalid name';
        }
      },
      {
        type: 'input',
        name: 'email',
        message: 'Email address:',
        validate: (input: string) => {
          const result = Validators.email(input);
          return result.isValid || result.error || 'Invalid email';
        }
      },
      {
        type: 'input',
        name: 'street',
        message: 'Street address:',
        validate: (input: string) => {
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
        choices: ['CA', 'NY', 'TX', 'FL', 'DE', 'WA', 'IL', 'Other...'],
        pageSize: 10
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
        type: 'number',
        name: 'ownershipPercentage',
        message: 'Ownership percentage (%):',
        default: totalCount === 1 ? 100 : 0,
        validate: (input: number) => {
          const result = Validators.ownershipPercentage(input);
          return result.isValid || result.error || 'Invalid percentage';
        }
      },
      {
        type: 'list',
        name: 'idType',
        message: 'Tax identification type:',
        choices: [
          { name: 'SSN (Social Security Number)', value: 'ssn' },
          { name: 'EIN (Employer Identification Number)', value: 'ein' }
        ]
      },
      {
        type: 'password',
        name: 'taxId',
        message: (answers: any) => answers.idType === 'ssn' ? 'SSN (XXX-XX-XXXX):' : 'EIN (XX-XXXXXXX):',
        mask: '*',
        validate: (input: string, answers: any) => {
          const result = answers.idType === 'ssn' ?
            Validators.ssn(input) :
            Validators.ein(input);
          return result.isValid || result.error || 'Invalid ID';
        }
      }
    ]);

    const address: Address = {
      street1: answers.street,
      city: answers.city,
      state: answers.state as USState,
      zipCode: answers.zipCode
    };

    // Split name into first and last name
    const nameParts = answers.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    const shareholder: Shareholder = {
      firstName,
      lastName,
      email: answers.email,
      phone: '', // Will be collected separately if needed
      address,
      ownershipPercentage: answers.ownershipPercentage
    };

    if (answers.idType === 'ssn') {
      shareholder.ssn = answers.taxId;
    } else {
      shareholder.ein = answers.taxId;
    }

    return shareholder;
  }

  /**
   * Registered agent information
   */
  static async registeredAgent(): Promise<RegisteredAgent> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useOwner',
        message: 'Would you like to use one of the owners as the registered agent?',
        default: true
      }
    ]);

    if (answers.useOwner) {
      // This would be handled in the flow to select from shareholders
      return {} as RegisteredAgent; // Placeholder
    }

    const agentAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Registered agent name or company:',
        validate: (input: string) => {
          const result = Validators.required(input, 'Registered agent name');
          return result.isValid || result.error || 'Required';
        }
      },
      {
        type: 'input',
        name: 'street',
        message: 'Physical street address (P.O. Box not allowed):',
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
        type: 'input',
        name: 'state',
        message: 'State:',
        validate: (input: string) => input.length === 2 || 'Use 2-letter state code'
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
        name: 'email',
        message: 'Email address:',
        validate: (input: string) => {
          const result = Validators.email(input);
          return result.isValid || result.error || 'Invalid email';
        }
      },
      {
        type: 'input',
        name: 'phone',
        message: 'Phone number:',
        validate: (input: string) => {
          const result = Validators.phone(input);
          return result.isValid || result.error || 'Invalid phone';
        }
      }
    ]);

    return {
      name: agentAnswers.name,
      address: {
        street1: agentAnswers.street,
        city: agentAnswers.city,
        state: agentAnswers.state as USState,
        zipCode: agentAnswers.zipCode
      },
      email: agentAnswers.email,
      phone: agentAnswers.phone,
      isIndividual: false
    };
  }

  /**
   * Confirmation prompt
   */
  static async confirmSummary(): Promise<boolean> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Continue to payment', value: 'continue' },
          { name: 'Edit information', value: 'edit' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (answers.action === 'cancel') {
      const confirmCancel = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to cancel? Your progress will be saved.',
          default: false
        }
      ]);

      if (confirmCancel.confirm) {
        throw new Error('User cancelled');
      }
      return false;
    }

    return answers.action === 'continue';
  }

  /**
   * Payment confirmation
   */
  static async confirmPayment(total: number): Promise<boolean> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Proceed with payment of $${total.toFixed(2)}?`,
        default: true
      }
    ]);

    return answers.confirm;
  }

  /**
   * Resume session prompt
   */
  static async resumeSession(): Promise<boolean> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'We found a previous session. Would you like to:',
        choices: [
          { name: 'Resume where I left off', value: 'resume' },
          { name: 'Start fresh', value: 'new' }
        ]
      }
    ]);

    return answers.action === 'resume';
  }

  /**
   * Edit field selection
   */
  static async selectFieldToEdit(fields: string[]): Promise<string> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'field',
        message: 'Which field would you like to edit?',
        choices: [...fields, new inquirer.Separator(), 'Go back']
      }
    ]);

    return answers.field;
  }
}
