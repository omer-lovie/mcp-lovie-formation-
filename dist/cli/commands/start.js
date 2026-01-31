"use strict";
/**
 * Main company formation flow command
 * This file uses the FormationOrchestrator instead of standalone prompt functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFormation = startFormation;
const FormationOrchestrator_1 = require("../../core/FormationOrchestrator");
const display_1 = require("../../utils/display");
/**
 * Main company formation flow
 */
async function startFormation() {
    try {
        const orchestrator = new FormationOrchestrator_1.FormationOrchestrator();
        // The orchestrator is event-driven, no single run method
        display_1.Display.info('Formation orchestrator initialized');
    }
    catch (error) {
        display_1.Display.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}
//# sourceMappingURL=start.js.map