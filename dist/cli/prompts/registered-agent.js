"use strict";
/**
 * Registered agent information prompts
 * FR-006: Conversational prompts
 * FR-007: Plain language explanations
 * FR-008: Input validation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectRegisteredAgentInfo = collectRegisteredAgentInfo;
const inquirer_1 = __importDefault(require("inquirer"));
const validators_1 = require("../validators");
const formatter_1 = require("../utils/formatter");
/**
 * Collect registered agent information
 */
async function collectRegisteredAgentInfo(currentStep, totalSteps) {
    (0, formatter_1.print)((0, formatter_1.formatSubheader)((0, formatter_1.formatProgress)(currentStep, totalSteps, 'Registered Agent')));
    (0, formatter_1.print)((0, formatter_1.formatInfo)('A registered agent receives legal documents on behalf of your company.\n'));
    (0, formatter_1.print)((0, formatter_1.formatInfo)('This can be yourself, a business partner, or a registered agent service.\n'));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the registered agent\'s full name?',
            validate: (input) => {
                const result = (0, validators_1.validateName)(input);
                return result.valid ? true : result.message || 'Invalid name';
            }
        },
        {
            type: 'input',
            name: 'address',
            message: 'What is the registered agent\'s physical address? (Must be in the state of incorporation)',
            validate: (input) => {
                const result = (0, validators_1.validateAddress)(input);
                return result.valid ? true : result.message || 'Invalid address';
            }
        },
        {
            type: 'input',
            name: 'email',
            message: 'What is the registered agent\'s email address?',
            validate: (input) => {
                const result = (0, validators_1.validateEmail)(input);
                return result.valid ? true : result.message || 'Invalid email';
            }
        },
        {
            type: 'input',
            name: 'phone',
            message: 'What is the registered agent\'s phone number?',
            validate: (input) => {
                const result = (0, validators_1.validatePhone)(input);
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
//# sourceMappingURL=registered-agent.js.map