"use strict";
/**
 * Company information prompts
 * FR-006: Conversational, interactive prompts
 * FR-007: Plain language explanations
 * FR-008: Real-time validation
 * FR-010: Keyboard navigation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askCompanyName = askCompanyName;
exports.askState = askState;
exports.askCompanyType = askCompanyType;
exports.collectCompanyInfo = collectCompanyInfo;
const inquirer_1 = __importDefault(require("inquirer"));
const validators_1 = require("../validators");
const formatter_1 = require("../utils/formatter");
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
async function askCompanyName(currentStep, totalSteps) {
    (0, formatter_1.print)((0, formatter_1.formatSubheader)((0, formatter_1.formatProgress)(currentStep, totalSteps, 'Company Name')));
    const { companyName } = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'companyName',
            message: 'What would you like to name your company?',
            validate: (input) => {
                const result = (0, validators_1.validateCompanyName)(input);
                return result.valid ? true : result.message || 'Invalid company name';
            }
        }
    ]);
    return companyName.trim();
}
/**
 * Collect state of incorporation
 */
async function askState(currentStep, totalSteps) {
    (0, formatter_1.print)((0, formatter_1.formatSubheader)((0, formatter_1.formatProgress)(currentStep, totalSteps, 'State of Incorporation')));
    (0, formatter_1.print)('💡 Tip: Delaware is popular for its business-friendly laws, but your home state might be simpler.\n');
    const { state } = await inquirer_1.default.prompt([
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
async function askCompanyType(currentStep, totalSteps) {
    (0, formatter_1.print)((0, formatter_1.formatSubheader)((0, formatter_1.formatProgress)(currentStep, totalSteps, 'Company Type')));
    const { companyType } = await inquirer_1.default.prompt([
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
async function collectCompanyInfo() {
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
//# sourceMappingURL=company-info.js.map