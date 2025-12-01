import { RateLimitRule } from '../safety/rate-limit.types';

export interface BaseJobPayload {
  jobId?: string;
  accountId: string;
  campaignId: string;
  campaignTargetId: string;
  targetId: string;
  targetDid?: string | null;
  targetHandle?: string | null;
  templateId: string;
  logId: string;
  message: string;
  limits?: RateLimitRule;
  renderContext: Record<string, string>;
  conversationId?: string | null;
}

export interface DmJobPayload extends BaseJobPayload {}

export interface PostJobPayload extends BaseJobPayload {
  richTextJson?: Record<string, unknown> | null;
}
