/**
 * Payment information prompts
 * FR-018: Secure payment collection
 * FR-019: Display costs before payment
 */

import inquirer from 'inquirer';
import { formatSubheader, formatProgress, formatCurrency, formatSummary, print } from '../utils/formatter';

export interface PaymentInfo {
  confirmed: boolean;
}

interface PricingBreakdown {
  stateFilingFee: number;
  serviceFee: number;
  total: number;
}

/**
 * Get pricing based on state and company type
 */
function getPricing(state: string, companyType: string): PricingBreakdown {
  // Simplified pricing - in production, this would come from a database
  const stateFilingFees: Record<string, number> = {
    'Delaware': 90,
    'California': 70,
    'Texas': 300,
    'Florida': 125,
    'New York': 200,
    // Default for other states
    'default': 100
  };

  const stateFilingFee = stateFilingFees[state] || stateFilingFees['default'];
  const serviceFee = 99; // Lovie service fee

  return {
    stateFilingFee,
    serviceFee,
    total: stateFilingFee + serviceFee
  };
}

/**
 * Display pricing breakdown and collect payment confirmation
 */
export async function collectPaymentInfo(
  state: string,
  companyType: string,
  currentStep: number,
  totalSteps: number
): Promise<PaymentInfo> {
  print(formatSubheader(formatProgress(currentStep, totalSteps, 'Payment')));

  const pricing = getPricing(state, companyType);

  print('\n💳 Payment Summary\n');
  print(formatSummary([
    { label: 'State Filing Fee', value: formatCurrency(pricing.stateFilingFee) },
    { label: 'Lovie Service Fee', value: formatCurrency(pricing.serviceFee) },
    { label: 'Total Amount', value: formatCurrency(pricing.total) }
  ]));

  print('\n');

  const { proceedToPayment } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceedToPayment',
      message: `Proceed to payment of ${formatCurrency(pricing.total)}?`,
      default: true
    }
  ]);

  if (!proceedToPayment) {
    return { confirmed: false };
  }

  // In production, this would integrate with Stripe or similar payment processor
  // For now, we'll simulate payment collection
  print('\n🔒 Payment processing will be handled securely via Stripe.');
  print('For this demo, we\'ll simulate payment confirmation.\n');

  const { confirmPayment } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmPayment',
      message: 'Simulate successful payment?',
      default: true
    }
  ]);

  return { confirmed: confirmPayment };
}
