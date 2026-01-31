"use strict";
/**
 * Backend Agent API Clients
 *
 * Exports all API clients for backend agent integration.
 * Provides factory functions for easy client creation with environment variables.
 *
 * @module services/agents
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentClient = exports.createFilingClient = exports.createDocumentFillerClient = exports.createNameCheckClient = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./nameCheckClient"), exports);
__exportStar(require("./documentFillerClient"), exports);
__exportStar(require("./filingClient"), exports);
__exportStar(require("./paymentClient"), exports);
// Re-export factory functions for convenience
var nameCheckClient_1 = require("./nameCheckClient");
Object.defineProperty(exports, "createNameCheckClient", { enumerable: true, get: function () { return nameCheckClient_1.createNameCheckClient; } });
var documentFillerClient_1 = require("./documentFillerClient");
Object.defineProperty(exports, "createDocumentFillerClient", { enumerable: true, get: function () { return documentFillerClient_1.createDocumentFillerClient; } });
var filingClient_1 = require("./filingClient");
Object.defineProperty(exports, "createFilingClient", { enumerable: true, get: function () { return filingClient_1.createFilingClient; } });
var paymentClient_1 = require("./paymentClient");
Object.defineProperty(exports, "createPaymentClient", { enumerable: true, get: function () { return paymentClient_1.createPaymentClient; } });
//# sourceMappingURL=index.js.map