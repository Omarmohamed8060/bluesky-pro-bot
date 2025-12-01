"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueskyRequestError = exports.AccountCooldownError = exports.RateLimitExceededError = void 0;
class RateLimitExceededError extends Error {
    constructor(retryInMs) {
        super('Rate limit exceeded');
        this.retryInMs = retryInMs;
    }
}
exports.RateLimitExceededError = RateLimitExceededError;
class AccountCooldownError extends Error {
    constructor(resumeAt) {
        super('Account is currently in cooldown');
        this.resumeAt = resumeAt;
    }
}
exports.AccountCooldownError = AccountCooldownError;
class BlueskyRequestError extends Error {
    constructor(message, status, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
exports.BlueskyRequestError = BlueskyRequestError;
//# sourceMappingURL=bluesky.errors.js.map