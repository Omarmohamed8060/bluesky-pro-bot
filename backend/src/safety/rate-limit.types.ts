export interface RateLimitRule {
  maxPerHour?: number | null;
  maxPerDay?: number | null;
  cooldownMinutesOn429?: number | null;
}
