/**
 * Shareholder/member information prompts
 * FR-006: Conversational prompts
 * FR-008: Input validation
 * FR-010: Keyboard navigation
 */

import inquirer from 'inquirer';
import { Shareholder } from '../types';
import {
  validateName,
  validateAddress,
  validateOwnershipPercentage,
  validateSSN,
  validateEIN
} from '../validators';
import { formatSubheader, formatProgress, print, formatInfo } from '../utils/formatter';

/**
 * Collect information for a single shareholder/member
 */
async function collectShareholderDetails(index: number, isLLC: boolean): Promise<Shareholder> {
  const entityType = isLLC ? 'member' : 'shareholder';

  print(formatInfo(`\nEntering ${entityType} #${index + 1} details...`));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: `What is the ${entityType}'s full name?`,
      validate: (input: string) => {
        const result = validateName(input);
        return result.valid ? true : result.message || 'Invalid name';
      }
    },
    {
      type: 'input',
      name: 'address',
      message: `What is the ${entityType}'s address?`,
      validate: (input: string) => {
        const result = validateAddress(input);
        return result.valid ? true : result.message || 'Invalid address';
      }
    },
    {
      type: 'input',
      name: 'ownershipPercentage',
      message: `What percentage of the company will this ${entityType} own?`,
      default: '100',
      validate: (input: string) => {
        const result = validateOwnershipPercentage(input);
        return result.valid ? true : result.message || 'Invalid percentage';
      }
    },
    {
      type: 'list',
      name: 'entityType',
      message: `Is this ${entityType} an individual person or a business entity?`,
      choices: [
        { name: 'Individual person', value: 'individual' },
        { name: 'Business entity', value: 'entity' }
      ]
    }
  ]);

  // Ask for SSN if individual, EIN if entity
  if (answers.entityType === 'individual') {
    const { ssn } = await inquirer.prompt([
      {
        type: 'password',
        name: 'ssn',
        message: 'Social Security Number (SSN) - will be encrypted:',
        mask: '*',
        validate: (input: string) => {
          const result = validateSSN(input);
          return result.valid ? true : result.message || 'Invalid SSN';
        }
      }
    ]);

    return {
      name: answers.name.trim(),
      address: answers.address.trim(),
      ownershipPercentage: parseFloat(answers.ownershipPercentage),
      ssn: ssn.replace(/\-/g, '')
    };
  } else {
    const { ein } = await inquirer.prompt([
      {
        type: 'input',
        name: 'ein',
        message: 'Employer Identification Number (EIN):',
        validate: (input: string) => {
          const result = validateEIN(input);
          return result.valid ? true : result.message || 'Invalid EIN';
        }
      }
    ]);

    return {
      name: answers.name.trim(),
      address: answers.address.trim(),
      ownershipPercentage: parseFloat(answers.ownershipPercentage),
      ein: ein.replace(/\-/g, '')
    };
  }
}

/**
 * Collect all shareholder information
 */
export async function collectShareholderInfo(
  companyType: string,
  currentStep: number,
  totalSteps: number
): Promise<Shareholder[]> {
  const isLLC = companyType === 'LLC';
  const entityType = isLLC ? 'members' : 'shareholders';

  print(formatSubheader(formatProgress(currentStep, totalSteps, `Company ${isLLC ? 'Members' : 'Shareholders'}`)));
  print(formatInfo(`Let's add the ${entityType} who will own the company.\n`));

  const shareholders: Shareholder[] = [];
  let addMore = true;

  while (addMore) {
    const shareholder = await collectShareholderDetails(shareholders.length, isLLC);
    shareholders.push(shareholder);

    // Calculate total ownership
    const totalOwnership = shareholders.reduce((sum, sh) => sum + sh.ownershipPercentage, 0);

    if (totalOwnership >= 100) {
      print(formatInfo(`\n✓ Total ownership: ${totalOwnership.toFixed(2)}%`));
      addMore = false;
    } else {
      const { continueAdding } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueAdding',
          message: `Total ownership so far: ${totalOwnership.toFixed(2)}%. Would you like to add another ${entityType.slice(0, -1)}?`,
          default: true
        }
      ]);

      addMore = continueAdding;
    }
  }

  return shareholders;
}
