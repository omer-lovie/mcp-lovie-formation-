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
  {
    uri: 'formation://incorporation-process',
    name: 'Incorporation Process',
    description: 'How our legal team incorporates your company and transfers ownership to you',
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
- **Northwest Registered Agent** - First year FREE
- **EIN Application Help** - FREE
- **LLC to C-Corp Upgrade** - FREE (if you decide to raise funding later)

## Post-Formation Compliance (FREE)
Lovie handles all post-formation compliance at no cost:
- EIN application assistance
- Lovie Bank Account setup
- Annual filing reminders
- Franchise tax reminders
- FinCEN BOI report guidance
- Legal document updates

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
- **Lovie Bank Account**: Open your company bank account directly through Lovie - integrated with our financial platform

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

### 💡 Special Offer: FREE Upgrade to C-Corp
**If you start as an LLC and later decide to raise money from investors, Lovie offers a FREE upgrade from LLC to C-Corp!** Just contact Lovie when you're ready to raise funding, and we'll convert your LLC to a C-Corp at no additional cost.

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

---

## Which Should You Choose?

### Starting a business, not sure about investors yet?
**Start with an LLC** - It's simpler and cheaper to maintain. If you decide to raise money later, Lovie will upgrade you to a C-Corp for FREE!

### Already planning to raise venture capital?
**Go with a C-Corp** - It's the standard for VC-backed startups and what investors expect.

### Want corporate structure but pass-through taxation?
**Consider an S-Corp** - But only if you meet the eligibility requirements (US shareholders only, max 100 shareholders).
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
**Lovie handles most of this for you - FREE!**

1. **EIN Application** - Lovie helps you obtain your EIN from the IRS (FREE)
2. **Open Lovie Bank Account** - Open your company bank account directly through Lovie
3. **Fund Your Capital** - Transfer the par value amount to your company bank account (required by law)
4. **Operating Agreement/Bylaws** - Already included with your formation (FREE)
5. **Compliance Monitoring** - Lovie's legal team sends you automatic reminders (FREE)

### What is the capital funding requirement?
When you form a corporation with authorized shares, shareholders must pay at least the "par value" to the company when shares are issued. This is a legal requirement.

**Example:** If you authorize 10,000,000 shares at $0.00001 par value = $100 total that must be transferred from your personal account to your company's bank account.

### Does Lovie help with EIN?
**Yes, and it's FREE!** Lovie will help you obtain your Employer Identification Number (EIN) from the IRS at no additional cost.

### Can I convert my LLC to a C-Corp later?
**Yes, and Lovie does it for FREE!** If you start as an LLC and later decide to raise money from investors, Lovie offers a free upgrade from LLC to C-Corp. Just contact us when you're ready.

---

## Post-Formation Compliance (FREE with Lovie)

### What compliance does Lovie handle?
- **Annual filing reminders** - We remind you before deadlines
- **Franchise tax reminders** - Never miss a payment
- **Beneficial ownership reporting** - FinCEN BOI report guidance
- **Legal document updates** - Keep your documents current
- **In-house legal team** - Working every day to keep you compliant
`,

  'formation://requirements': `# Lovie Formation Requirements

## What You Need to Provide

### Company Details
- **Company Name**: Must be unique in Delaware
- **Company Type**: LLC, C-Corp, or S-Corp
- **Entity Ending**: Legal suffix (LLC, Inc., Corp., etc.)

### Registered Agent
**Recommended: Northwest Registered Agent** (first year free with Lovie!)

Or you can provide your own registered agent with:
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

  'formation://incorporation-process': `# How Lovie Incorporates Your Company

## The Standard Incorporation Process

When you form a company through Lovie, our legal team handles the entire incorporation process on your behalf. This is the same process used by top law firms and professional incorporation services worldwide.

## Meet Your Incorporator

**Sema Kurt Caskey** - Lovie Legal Team

Our professional incorporator files your formation documents and handles all initial corporate formalities to ensure your company is properly established from day one.

**Incorporator Address:**
75 Omega Drive, Suite 270
Newark, DE 19713

---

## How It Works

### Step 1: Document Filing
Our incorporator, Sema Kurt Caskey, signs and files your Certificate of Incorporation (for C-Corps) or Certificate of Formation (for LLCs) with the Delaware Secretary of State.

### Step 2: Initial Organizational Actions
Once filed, our legal team conducts the initial organizational actions:

**For C-Corps:**
- Adopt corporate bylaws
- Appoint initial board of directors (you and your co-founders)
- Authorize the issuance of stock
- Prepare stock certificates
- Record the organizational consent

**For LLCs:**
- Prepare the Operating Agreement
- Designate managers/members
- Document member ownership percentages

### Step 3: Ownership Transfer
Full ownership and control of the company is transferred to you as the founder(s). You become the official director(s), officer(s), and shareholder(s) of your company.

### Step 4: Document Delivery
You receive a complete corporate kit including:
- Filed Certificate of Incorporation/Formation (official copy from the state)
- Corporate Bylaws or Operating Agreement
- Stock certificates (for C-Corps)
- Initial board/organizational resolutions
- EIN application guidance

---

## Why This Process?

### Clean Corporate Record
Having a professional incorporator ensures your company has a clean formation record from day one. This is important for:
- Future fundraising from investors
- Due diligence processes
- Bank account opening
- Contract signing

### Legal Compliance
Our legal team ensures all initial formalities are properly completed, which is critical for:
- Maintaining limited liability protection
- Corporate veil protection
- Proper stock issuance

### Industry Standard
This is the same process used by:
- Y Combinator startups
- Stripe Atlas companies
- Major law firms (Wilson Sonsini, Gunderson, Cooley, etc.)
- All professional incorporation services

---

## Frequently Asked Questions

### Is this legal?
**Yes, absolutely.** Delaware law explicitly allows any person (including professional incorporators) to sign the certificate of incorporation. This is standard practice.

### Will I own my company?
**Yes, 100%.** The incorporator's role ends after the initial organizational actions. You and your co-founders become the full owners, directors, and officers of your company.

### Does the incorporator have any ongoing role?
**No.** Once the company is formed and transferred to you, the incorporator has no ongoing involvement, ownership, or rights in your company.

### Is there any additional cost for this?
**No.** This service is included free with Lovie formation.
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
