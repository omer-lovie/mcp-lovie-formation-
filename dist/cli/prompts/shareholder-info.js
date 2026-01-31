"use strict";
/**
 * Shareholder/member information prompts
 * FR-006: Conversational prompts
 * FR-008: Input validation
 * FR-010: Keyboard navigation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectShareholderInfo = collectShareholderInfo;
const inquirer_1 = __importDefault(require("inquirer"));
const validators_1 = require("../validators");
const formatter_1 = require("../utils/formatter");
/**
 * Collect information for a single shareholder/member
 */
async function collectShareholderDetails(index, isLLC) {
    const entityType = isLLC ? 'member' : 'shareholder';
    (0, formatter_1.print)((0, formatter_1.formatInfo)(`\nEntering ${entityType} #${index + 1} details...`));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'name',
            message: `What is the ${entityType}'s full name?`,
            validate: (input) => {
                const result = (0, validators_1.validateName)(input);
                return result.valid ? true : result.message || 'Invalid name';
            }
        },
        {
            type: 'input',
            name: 'address',
            message: `What is the ${entityType}'s address?`,
            validate: (input) => {
                const result = (0, validators_1.validateAddress)(input);
                return result.valid ? true : result.message || 'Invalid address';
            }
        },
        {
            type: 'input',
            name: 'ownershipPercentage',
            message: `What percentage of the company will this ${entityType} own?`,
            default: '100',
            validate: (input) => {
                const result = (0, validators_1.validateOwnershipPercentage)(input);
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
        const { ssn } = await inquirer_1.default.prompt([
            {
                type: 'password',
                name: 'ssn',
                message: 'Social Security Number (SSN) - will be encrypted:',
                mask: '*',
                validate: (input) => {
                    const result = (0, validators_1.validateSSN)(input);
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
    }
    else {
        const { ein } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'ein',
                message: 'Employer Identification Number (EIN):',
                validate: (input) => {
                    const result = (0, validators_1.validateEIN)(input);
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
async function collectShareholderInfo(companyType, currentStep, totalSteps) {
    const isLLC = companyType === 'LLC';
    const entityType = isLLC ? 'members' : 'shareholders';
    (0, formatter_1.print)((0, formatter_1.formatSubheader)((0, formatter_1.formatProgress)(currentStep, totalSteps, `Company ${isLLC ? 'Members' : 'Shareholders'}`)));
    (0, formatter_1.print)((0, formatter_1.formatInfo)(`Let's add the ${entityType} who will own the company.\n`));
    const shareholders = [];
    let addMore = true;
    while (addMore) {
        const shareholder = await collectShareholderDetails(shareholders.length, isLLC);
        shareholders.push(shareholder);
        // Calculate total ownership
        const totalOwnership = shareholders.reduce((sum, sh) => sum + sh.ownershipPercentage, 0);
        if (totalOwnership >= 100) {
            (0, formatter_1.print)((0, formatter_1.formatInfo)(`\n✓ Total ownership: ${totalOwnership.toFixed(2)}%`));
            addMore = false;
        }
        else {
            const { continueAdding } = await inquirer_1.default.prompt([
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
//# sourceMappingURL=shareholder-info.js.map