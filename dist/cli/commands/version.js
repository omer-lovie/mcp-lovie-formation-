"use strict";
/**
 * Version command
 * FR-003: Provide --version command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.showVersion = showVersion;
const fs_1 = require("fs");
const path_1 = require("path");
const formatter_1 = require("../utils/formatter");
/**
 * Display version information
 */
function showVersion() {
    try {
        // Read version from package.json
        const packageJsonPath = (0, path_1.join)(__dirname, '../../../package.json');
        const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, 'utf-8'));
        (0, formatter_1.print)(formatter_1.colors.primary.bold('Lovie CLI'));
        (0, formatter_1.print)(formatter_1.colors.muted(`Version ${packageJson.version}`));
        (0, formatter_1.print)(formatter_1.colors.muted('Company formation made simple.'));
    }
    catch (error) {
        (0, formatter_1.print)(formatter_1.colors.error('Unable to determine version'));
    }
}
//# sourceMappingURL=version.js.map