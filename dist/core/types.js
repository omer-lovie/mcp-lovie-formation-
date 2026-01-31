"use strict";
/**
 * Core type definitions for company formation flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.State = exports.CompanyType = exports.FormationStatus = exports.FormationStep = void 0;
/**
 * Formation step identifiers
 */
var FormationStep;
(function (FormationStep) {
    FormationStep["NAME"] = "name";
    FormationStep["COMPANY_DETAILS"] = "company_details";
    FormationStep["SHAREHOLDERS"] = "shareholders";
    FormationStep["REGISTERED_AGENT"] = "registered_agent";
    FormationStep["REVIEW"] = "review";
    FormationStep["PAYMENT"] = "payment";
    FormationStep["FILING"] = "filing";
    FormationStep["CONFIRMATION"] = "confirmation";
})(FormationStep || (exports.FormationStep = FormationStep = {}));
/**
 * Formation session status
 */
var FormationStatus;
(function (FormationStatus) {
    FormationStatus["INITIATED"] = "initiated";
    FormationStatus["IN_PROGRESS"] = "in_progress";
    FormationStatus["PAYMENT_PENDING"] = "payment_pending";
    FormationStatus["PAYMENT_COMPLETE"] = "payment_complete";
    FormationStatus["FILING_IN_PROGRESS"] = "filing_in_progress";
    FormationStatus["COMPLETED"] = "completed";
    FormationStatus["FAILED"] = "failed";
    FormationStatus["CANCELLED"] = "cancelled";
})(FormationStatus || (exports.FormationStatus = FormationStatus = {}));
/**
 * Company types supported
 */
var CompanyType;
(function (CompanyType) {
    CompanyType["LLC"] = "llc";
    CompanyType["C_CORP"] = "c_corp";
    CompanyType["S_CORP"] = "s_corp";
})(CompanyType || (exports.CompanyType = CompanyType = {}));
/**
 * US states (starting with Delaware for MVP)
 */
var State;
(function (State) {
    State["DE"] = "DE";
    State["CA"] = "CA";
    State["TX"] = "TX";
    State["NY"] = "NY";
    State["FL"] = "FL";
    // More states to be added
})(State || (exports.State = State = {}));
//# sourceMappingURL=types.js.map