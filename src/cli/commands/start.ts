/**
 * Main company formation flow command
 * This file uses the FormationOrchestrator instead of standalone prompt functions
 */

import { FormationOrchestrator } from '../../core/FormationOrchestrator';
import { Display } from '../../utils/display';

/**
 * Main company formation flow
 */
export async function startFormation(): Promise<void> {
  try {
    const orchestrator = new FormationOrchestrator();
    // The orchestrator is event-driven, no single run method
    Display.info('Formation orchestrator initialized');
  } catch (error) {
    Display.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
