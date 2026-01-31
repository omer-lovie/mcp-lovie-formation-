/**
 * Payment information prompts
 * FR-018: Secure payment collection
 * FR-019: Display costs before payment
 */
export interface PaymentInfo {
    confirmed: boolean;
}
/**
 * Display pricing breakdown and collect payment confirmation
 */
export declare function collectPaymentInfo(state: string, companyType: string, currentStep: number, totalSteps: number): Promise<PaymentInfo>;
//# sourceMappingURL=payment.d.ts.map