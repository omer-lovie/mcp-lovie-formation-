"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATE_DESCRIPTIONS = exports.STATE_COMPANY_TYPES = exports.COMPANY_TYPE_DESCRIPTIONS = exports.ENTITY_ENDINGS = exports.DEFAULT_SHARE_STRUCTURE = exports.DEFAULT_REGISTERED_AGENT = exports.DEFAULT_INCORPORATOR = exports.SessionStatus = exports.FormationStep = void 0;
// Formation workflow step enumeration
var FormationStep;
(function (FormationStep) {
    FormationStep["CREATED"] = "created";
    FormationStep["BUSINESS_DESCRIBED"] = "business_described";
    FormationStep["STATE_SELECTED"] = "state_selected";
    FormationStep["TYPE_SELECTED"] = "type_selected";
    FormationStep["ENDING_SELECTED"] = "ending_selected";
    FormationStep["NAME_SET"] = "name_set";
    FormationStep["NAME_CHECKED"] = "name_checked";
    FormationStep["COMPANY_ADDRESS_SET"] = "company_address_set";
    FormationStep["AGENT_SET"] = "agent_set";
    FormationStep["SHARES_SET"] = "shares_set";
    FormationStep["SHAREHOLDERS_ADDED"] = "shareholders_added";
    FormationStep["AUTHORIZED_PARTY_SET"] = "authorized_party_set";
    FormationStep["CERTIFICATE_GENERATED"] = "certificate_generated";
    FormationStep["CERTIFICATE_APPROVED"] = "certificate_approved";
    FormationStep["COMPLETED"] = "completed";
})(FormationStep || (exports.FormationStep = FormationStep = {}));
// Session status enumeration
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["CREATED"] = "created";
    SessionStatus["IN_PROGRESS"] = "in_progress";
    SessionStatus["REVIEW"] = "review";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["ABANDONED"] = "abandoned";
    SessionStatus["EXPIRED"] = "expired";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
// Default incorporator - Lovie's internal legal team member
exports.DEFAULT_INCORPORATOR = {
    name: 'Sema Kurt Caskey',
    address: {
        street1: '75 Omega Drive',
        street2: 'Suite 270',
        city: 'Newark',
        state: 'DE',
        zipCode: '19713',
        country: 'US',
    },
};
// Default values
exports.DEFAULT_REGISTERED_AGENT = {
    isDefault: true,
    name: 'Northwest Registered Agent',
    email: 'support@northwestregisteredagent.com',
    phone: '1-509-768-2249',
    address: {
        street1: '8 The Green, Suite A',
        city: 'Dover',
        state: 'DE',
        zipCode: '19901',
        county: 'Kent',
    },
};
exports.DEFAULT_SHARE_STRUCTURE = {
    isDefault: true,
    authorizedShares: 10000000,
    parValuePerShare: 0.00001,
};
// Entity endings by company type
exports.ENTITY_ENDINGS = {
    'LLC': ['LLC', 'L.L.C.', 'Limited Liability Company'],
    'C-Corp': ['Inc.', 'Incorporated', 'Corp.', 'Corporation', 'Company', 'Co.', 'Limited', 'Ltd.'],
};
// Company type descriptions
exports.COMPANY_TYPE_DESCRIPTIONS = {
    'LLC': 'Limited Liability Company - Flexible structure with pass-through taxation',
    'C-Corp': 'C Corporation - Traditional corporate structure, preferred by investors for fundraising',
};
// State-specific company type availability
exports.STATE_COMPANY_TYPES = {
    'DE': ['LLC', 'C-Corp'],
    'WY': ['LLC'],
};
// State descriptions
exports.STATE_DESCRIPTIONS = {
    'DE': 'Delaware - Premier business jurisdiction with specialized courts and well-established corporate law',
    'WY': 'Wyoming - Strong privacy protections, no state income tax, and low fees',
};
//# sourceMappingURL=types.js.map