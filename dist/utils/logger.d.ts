/**
 * Logging utility for Lovie CLI
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private level;
    constructor(level?: LogLevel);
    setLevel(level: LogLevel): void;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    success(message: string): void;
    step(message: string): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map