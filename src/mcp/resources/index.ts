import { Resource } from '@modelcontextprotocol/sdk/types.js';

// Resource definitions
export const FORMATION_RESOURCES: Resource[] = [
  {
    uri: 'formation://guide',
    name: 'Formation Guide',
    description: 'Step-by-step guide for Delaware company formation process',
    mimeType: 'text/markdown',
  },
  {
    uri: 'formation://pricing',
    name: 'Pricing Information',
    description: 'Delaware filing fees and service costs',
    mimeType: 'text/markdown',
  },
  {
    uri: 'formation://company-types',
    name: 'Company Types',
    description: 'Detailed comparison of LLC, C-Corp, and S-Corp',
    mimeType: 'text/markdown',
  },
  {
    uri: 'formation://faq',
    name: 'FAQ',
    description: 'Frequently asked questions about company formation',
    mimeType: 'text/markdown',
  },
  {
    uri: 'formation://requirements',
    name: 'Requirements',
    description: 'Required information for Delaware company formation',
    mimeType: 'text/markdown',
  },
];

// Resource content - EDIT THIS CONTENT TO CUSTOMIZE YOUR MCP
export const RESOURCE_CONTENT: Record<string, string> = {
  'formation://guide': `# Lovie - Delaware Company Formation Guide

## Overview
Lovie helps you form a Delaware company step-by-step, completely free. The process takes about 3-5 minutes to complete.

**What you get with Lovie:**
- Free company formation (no service fees)
- Lovie as your incorporator
- All legally compliant documents
- In-house legal team working every day to keep you compliant
- Step-by-step compliance guide
- Help with business address and banking

## Steps

### 1. Start a Session
Call \`formation_start\` to begin. You'll receive a session ID to use for all subsequent calls.

### 2. Select State
Call \`formation_set_state\` with state "DE" (Delaware is currently the only supported state).

### 3. Choose Company Type
Call \`formation_set_company_type\` with one of:
- **LLC** - Limited Liability Company (simplest, most flexible)
- **C-Corp** - C Corporation (best for raising investment)
- **S-Corp** - S Corporation (tax advantages for small businesses)

### 4. Select Entity Ending
Call \`formation_set_entity_ending\` to choose your company's legal suffix:
- LLC: "LLC", "L.L.C.", "Limited Liability Company"
- Corp: "Inc.", "Incorporated", "Corp.", "Corporation"

### 5. Set Company Name
Call \`formation_set_company_name\` with your desired company name (without the ending).

### 6. Check Name Availability (Optional)
Call \`formation_check_name\` to verify the name is available with Delaware Secretary of State.

### 7. Set Registered Agent
Call \`formation_set_registered_agent\` with agent details. A registered agent is required in Delaware.

### 8. Set Share Structure (Corps only)
For C-Corp or S-Corp, call \`formation_set_share_structure\` to define authorized shares and par value.

### 9. Add Shareholders/Members
Call \`formation_add_shareholder\` for each owner. Total ownership must not exceed 100%.

### 10. Set Authorized Party
Call \`formation_set_authorized_party\` - this person signs the formation documents.

### 11. Generate Certificate
Call \`formation_generate_certificate\` to create the Certificate of Incorporation PDF.

### 12. Review and Approve
Review the PDF at the provided URL, then call \`formation_approve_certificate\` to complete.

## Tips
- Use \`formation_get_status\` anytime to see current progress
- Use \`formation_resume\` to get guidance on the next step
- Sessions expire after 24 hours
`,

  'formation://pricing': `# Lovie Formation Pricing

## Lovie Service Fee
**FREE** - We don't charge you for company formation. Lovie handles everything at no cost to you.

## What's Included (Free)
- Company formation filing
- Lovie as your incorporator
- All legally compliant documents
- Certificate of Formation/Incorporation
- Operating Agreement (LLC) or Bylaws (Corp)
- Step-by-step compliance guide
- Ongoing compliance reminders
- **In-house legal team** working every day to keep you compliant with local and federal law

## State Filing Fees (Paid to Delaware)
These are government fees that go directly to Delaware:

### LLC
- **Standard Filing**: $90
- **Same-Day Filing**: +$100
- **24-Hour Filing**: +$50

### Corporation (C-Corp / S-Corp)
- **Standard Filing**: $89 (minimum)
- **Same-Day Filing**: +$100
- **24-Hour Filing**: +$50

## Annual Fees (Delaware Requirements)

### LLC
- **Annual Tax**: $300 (due June 1st each year)

### Corporation
- **Franchise Tax**: Minimum $175/year
- **Annual Report Fee**: $50/year

## Additional Lovie Services

### Business Address
- **Virtual Address**: Available through Lovie
- **Physical Address**: Available through Lovie

### Banking
- **Business Bank Account**: Lovie helps you open and manage your company bank account

### Lovie Financial Platform
- AI-first generative UI for all your financial needs
- Token-based pricing (a little more than free)
- Expense tracking, invoicing, payments, and more
`,

  'formation://company-types': `# Company Types Comparison

## LLC (Limited Liability Company)

### Best For
- Small businesses and startups
- Solo entrepreneurs
- Real estate holdings
- Consulting businesses

### Advantages
- Simple formation and maintenance
- Flexible management structure
- Pass-through taxation (no double taxation)
- Limited liability protection
- No ownership restrictions

### Disadvantages
- Cannot issue stock
- Less attractive to venture capital investors
- Self-employment taxes on profits

---

## C-Corporation

### Best For
- Startups seeking venture capital
- Companies planning to go public
- Businesses with many shareholders
- International expansion

### Advantages
- Can issue multiple classes of stock
- Attractive to investors
- Unlimited growth potential
- Employee stock options
- Perpetual existence

### Disadvantages
- Double taxation (corporate + dividend)
- More complex compliance requirements
- Board of directors required
- Formal meeting requirements

---

## S-Corporation

### Best For
- Small businesses wanting corporate structure
- Companies with fewer than 100 shareholders
- Businesses seeking tax advantages

### Advantages
- Pass-through taxation
- Limited liability protection
- Can pay reasonable salary (saves self-employment tax)
- Corporate structure and credibility

### Disadvantages
- Limited to 100 shareholders
- Only US citizens/residents can be shareholders
- One class of stock only
- Strict eligibility requirements
- Must elect S-Corp status with IRS
`,

  'formation://faq': `# Frequently Asked Questions

## About Lovie

### What is Lovie?
Lovie is an AI-first financial platform that helps you start and run your business. We provide free company formation, compliance tools, banking assistance, and a complete financial management platform.

### How much does Lovie charge for formation?
**Nothing!** Lovie's formation service is completely free. You only pay the state filing fees that go directly to Delaware.

### What makes Lovie different?
- **Free formation**: No service fees
- **Lovie as incorporator**: We handle all the paperwork
- **In-house legal team**: Our legal experts work every day to keep you compliant
- **Compliance included**: Legal documents and ongoing compliance guides
- **AI-first platform**: Generative UI for all your financial needs
- **Token-based pricing**: Our financial platform is almost free

---

## General Questions

### Why Delaware?
Delaware is the most popular state for incorporation because:
- Business-friendly laws and Court of Chancery
- Privacy protection (no public disclosure of officers/directors)
- No state income tax for companies operating outside Delaware
- Well-established corporate law precedents
- Fast filing times

### How long does formation take?
- **Standard**: 3-5 business days
- **24-Hour**: Next business day
- **Same-Day**: Same business day

### Do I need to live in Delaware?
No. You can form a Delaware company from anywhere in the world. Lovie provides registered agent services in Delaware.

---

## Lovie Services

### Can Lovie help with a business address?
Yes! Lovie offers both virtual and physical business addresses.

### Can Lovie help open a bank account?
Yes! Lovie helps you open and manage your company bank account, integrated with our financial platform.

### What is Lovie's financial platform?
An AI-first generative UI platform for:
- Expense tracking
- Invoicing
- Payments
- Financial reporting
- Compliance management
- And more...

All with token-based pricing (a little more than free).

---

## LLC Questions

### What is an Operating Agreement?
A document that outlines ownership, management structure, and operating procedures. Lovie provides this document for free.

### Can a single person form an LLC?
Yes. Delaware allows single-member LLCs.

---

## Corporation Questions

### What's the difference between authorized and issued shares?
- **Authorized shares**: Maximum shares the company CAN issue
- **Issued shares**: Shares actually given to shareholders

### What is par value?
The minimum price at which shares can be issued. Most startups use $0.0001 per share.

### How many shares should I authorize?
Common practice: 10,000,000 shares at $0.0001 par value.

---

## After Formation

### What do I need to do after forming my company?
Lovie guides you through everything:
1. Obtain an EIN from the IRS
2. Open a business bank account (Lovie helps!)
3. Set up your Operating Agreement or Bylaws (provided by Lovie)
4. Issue stock certificates (Corp)
5. File beneficial ownership report with FinCEN
6. Stay compliant with Lovie's compliance reminders
`,

  'formation://requirements': `# Lovie Formation Requirements

## What You Need to Provide

### Company Details
- **Company Name**: Must be unique in Delaware
- **Company Type**: LLC, C-Corp, or S-Corp
- **Entity Ending**: Legal suffix (LLC, Inc., Corp., etc.)

### Registered Agent
Lovie can serve as your registered agent, or you can specify:
- **Name**: Individual or company name
- **Physical Address**: Must be in Delaware
- **Email**: For correspondence
- **Phone**: Contact number

### Share Structure (Corporations Only)
- **Authorized Shares**: Number of shares the company can issue
- **Par Value**: Minimum price per share (e.g., $0.0001)

### Shareholders/Members
For each owner:
- **Full Name**: Legal name
- **Email Address**: Valid email
- **Ownership Percentage**: Share of the company
- **Address**: Mailing address (optional but recommended)

### Authorized Party
Lovie will be your incorporator. We handle the signing and filing.

---

## Name Requirements

### Delaware Name Rules
- Must be distinguishable from existing Delaware entities
- Must include proper entity ending
- Cannot imply government affiliation
- Cannot include restricted words without approval

### Restricted Words (Require Approval)
- Bank, Banking, Banker
- Insurance, Assurance
- Trust, Trustee
- University, College

---

## What Lovie Provides (Free)

### Documents Included
1. **Certificate of Formation/Incorporation**: Official document from Delaware
2. **Operating Agreement** (LLC) or **Bylaws** (Corp)
3. **Stock Certificates** (Corp)
4. **Compliance Calendar**: Reminders for annual filings and taxes

### After Formation Support
- EIN application guidance
- Bank account setup assistance
- Ongoing compliance reminders
- In-house legal team keeping you compliant with local and federal law
- Access to Lovie's AI-first financial platform
`,
};

// Get resource content by URI
export function getResourceContent(uri: string): string | null {
  return RESOURCE_CONTENT[uri] || null;
}

// List all available resources
export function getAllResources(): Resource[] {
  return FORMATION_RESOURCES;
}
