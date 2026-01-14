# Lovie CLI - Streamlined US Company Formation

> Form your US company in minutes, right from your terminal.

[![npm version](https://badge.fury.io/js/lovie.svg)](https://badge.fury.io/js/lovie)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Lovie CLI is a conversational command-line tool that guides you through forming a US company (LLC, C-Corp, or S-Corp) with real-time name checking, automatic document generation, and seamless state filing.

## ✨ Features

- **🚀 Quick Formation** - Complete company formation in under 15 minutes
- **💬 Conversational Interface** - Plain language, no legal jargon
- **⚡ Real-Time Name Check** - Instant company name availability verification
- **📄 Auto-Document Generation** - Professional incorporation documents created automatically
- **🏛️ Direct State Filing** - Submit directly to state authorities
- **💳 Secure Payment** - PCI-compliant payment processing
- **💾 Resume Capability** - Save progress and resume anytime
- **🖥️ Cross-Platform** - Works on macOS, Windows, and Linux

## 🎯 Quick Start

### Installation

**macOS (Homebrew)**
```bash
brew install lovie
```

**Windows/Linux/macOS (npm)**
```bash
npm install -g lovie
```

### Basic Usage

Start the company formation process:
```bash
lovie
```

Check version:
```bash
lovie --version
```

Get help:
```bash
lovie --help
```

## 📋 What You'll Need

Before starting, have these ready:

- **Company Information**
  - Desired company name (we'll check availability)
  - State of incorporation
  - Company type (LLC, C-Corp, or S-Corp)

- **Shareholder/Member Details**
  - Full legal names
  - Addresses
  - SSN or EIN
  - Ownership percentages

- **Registered Agent**
  - Name and address (must be in the state of incorporation)

- **Payment Method**
  - Credit/debit card for state filing fees and service fee

## 🎬 Usage Example

```bash
$ lovie

┌─────────────────────────────────────┐
│  Welcome to Lovie Company Formation │
└─────────────────────────────────────┘

Let's form your company! I'll guide you through the process.

? What would you like to name your company?
› Acme Innovations

⠋ Checking name availability...
✓ "Acme Innovations" is available in Delaware!

? Which state would you like to incorporate in?
› ◉ Delaware (Recommended for most startups)
  ○ California
  ○ New York
  ○ Texas
  ↓ 46 more states...

? What type of company would you like to form?
  ◉ LLC (Limited Liability Company)
    Simple structure, pass-through taxation
  ○ C-Corporation
    Best for raising venture capital
  ○ S-Corporation
    Pass-through taxation with corporate structure

...

┌──────────────────────────────────────┐
│  Review Your Company Information     │
└──────────────────────────────────────┘

Company Details:
  Name:     Acme Innovations LLC
  State:    Delaware
  Type:     Limited Liability Company

Members:
  1. John Smith (100%)
     123 Main St, San Francisco, CA 94102

Registered Agent:
  Delaware Corporate Services
  456 Business Ave, Wilmington, DE 19801

Costs:
  State Filing Fee:    $90.00
  Service Fee:         $49.00
  ─────────────────────────────
  Total:              $139.00

? Everything look correct? (Y/n)

✓ Payment processed successfully!
⠋ Generating incorporation documents...
✓ Documents generated
⠋ Filing with Delaware Division of Corporations...
✓ Filed successfully!

┌──────────────────────────────────────┐
│  🎉 Congratulations!                  │
└──────────────────────────────────────┘

Your company has been formed!

Filing Details:
  Confirmation #:  DE-2025-123456
  Filing Date:     December 23, 2025
  Status:          Approved

Documents saved to: ~/lovie/acme-innovations-llc/

Next Steps:
  1. Apply for EIN (Employer ID Number) at irs.gov
  2. Open a business bank account
  3. Set up accounting software
  4. File annual reports as required

Questions? Visit https://lovie.io/support
```

## 🗂️ Supported Company Types

### LLC (Limited Liability Company)
- Simple structure with flexible management
- Pass-through taxation
- Personal liability protection
- Fewer compliance requirements
- **Best for**: Small businesses, side projects, real estate

### C-Corporation
- Formal corporate structure
- Can issue multiple stock classes
- Attracts venture capital investment
- Corporate taxation (double taxation)
- **Best for**: Startups planning to raise VC funding

### S-Corporation
- Corporate structure with pass-through taxation
- Ownership restrictions (100 shareholders max, US citizens/residents only)
- Tax savings on self-employment
- More compliance requirements
- **Best for**: Small to medium businesses with US-based owners

## 🗺️ Supported States

**v1.0 (MVP)**: Delaware

**Planned**: California, Texas, New York, Florida, Wyoming, Nevada, and 44+ more states

## 🔒 Security & Privacy

- **Encryption**: All sensitive data encrypted at rest and in transit
- **PCI Compliance**: Payment processing through Stripe (PCI Level 1 certified)
- **Data Deletion**: Sensitive information cleared after formation completion
- **No Storage**: Credit card details never stored locally or on our servers
- **Secure Sessions**: Unique session IDs with encrypted local storage

## 🆘 Troubleshooting

### Installation Issues

**Error: Command not found**
```bash
# Verify installation
which lovie

# If using npm, ensure global bin is in PATH
npm config get prefix
# Add to PATH: export PATH="$(npm config get prefix)/bin:$PATH"
```

**Error: Permission denied**
```bash
# macOS/Linux: Use sudo (not recommended) or fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Common Issues

**"Name not available" errors**: Try variations of your company name. Add LLC/Inc suffix, use different words.

**Payment declined**: Check card details, ensure sufficient funds, try a different card.

**Connection timeout**: Check internet connection, retry operation. Data is saved automatically.

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for detailed solutions.

## 📚 Documentation

- [User Guide](docs/USER_GUIDE.md) - Comprehensive user guide with detailed walkthroughs
- [API Documentation](docs/API.md) - Backend agent API reference
- [Development Guide](docs/DEVELOPMENT.md) - Setup, testing, and contribution guide
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: https://lovie.io
- **Support**: https://lovie.io/support
- **GitHub**: https://github.com/lovie/lovie-cli
- **npm**: https://npmjs.com/package/lovie

## ⚖️ Legal Disclaimer

Lovie CLI is a document preparation and filing service. We do not provide legal or tax advice. For legal guidance on choosing the right business structure, consult with a licensed attorney. For tax advice, consult with a certified tax professional.

---

Made with ❤️ by the Lovie team
