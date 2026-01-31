/**
 * Welcome prompt and initial setup
 * FR-006: Conversational, interactive prompts
 * FR-007: Plain language, avoid jargon
 */
export interface WelcomeResult {
    action: 'new' | 'resume';
}
/**
 * Show welcome screen and check for existing sessions
 */
export declare function showWelcome(): Promise<WelcomeResult>;
/**
 * Show confirmation before starting fresh (when user has existing session)
 */
export declare function confirmStartFresh(): Promise<boolean>;
//# sourceMappingURL=welcome.d.ts.map