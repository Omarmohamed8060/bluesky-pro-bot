export class RateLimitExceededError extends Error {
  constructor(public readonly retryInMs?: number) {
    super('Rate limit exceeded');
  }
}

export class AccountCooldownError extends Error {
  constructor(public readonly resumeAt: Date) {
    super('Account is currently in cooldown');
  }
}

export class BlueskyRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}
