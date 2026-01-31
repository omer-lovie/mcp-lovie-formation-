/**
 * Interactive company formation flow with async name checking
 *
 * Flow:
 * 1. Select State (Delaware only for now)
 * 2. Select Company Type (LLC, C-Corp, S-Corp)
 * 3. Select Entity Ending (based on type)
 * 4. Enter Company Base Name (show preview with ending)
 * 5. Collect Registered Agent Info (name check runs in background)
 * 6. Collect Share Structure (C-Corp/S-Corp only: authorized shares & par value)
 * 7. Collect Shareholder/Member Info
 * 8. Collect Authorized Party (who signs documents)
 * 9. Async notification when name check completes
 * 10. Review and Confirm
 */
import { CompanyFormationData } from '../types';
/**
 * Main formation flow
 */
export declare function startFormationFlow(): Promise<CompanyFormationData | null>;
//# sourceMappingURL=formationFlow.d.ts.map