export declare class RateLimitExceededError extends Error {
    readonly retryInMs?: number | undefined;
    constructor(retryInMs?: number | undefined);
}
export declare class AccountCooldownError extends Error {
    readonly resumeAt: Date;
    constructor(resumeAt: Date);
}
export declare class BlueskyRequestError extends Error {
    readonly status?: number | undefined;
    readonly code?: string | undefined;
    constructor(message: string, status?: number | undefined, code?: string | undefined);
}
