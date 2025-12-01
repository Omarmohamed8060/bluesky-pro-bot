import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimitRule } from './rate-limit.types';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  async checkRateLimit(accountId: string, action: 'DM' | 'POST'): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  }> {
    const [account, coreSettings] = await Promise.all([
      this.prisma.account.findUnique({
        where: { id: accountId },
        include: {
          campaigns: {
            where: {
              type: action === 'DM' ? 'DM' : 'POST',
              status: 'RUNNING',
              startedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        }
      }),
      this.settingsService.getCoreSettings(),
    ]);

    if (!account) {
      return { allowed: false, reason: 'Account not found' };
    }

    const defaultLimits: RateLimitRule = {
      maxPerHour: coreSettings.maxDmsPerHour,
      maxPerDay: coreSettings.maxDmsPerDay,
      cooldownMinutesOn429: 60,
    };

    // Check if account is in cooldown
    if (account.cooldownUntil && account.cooldownUntil > new Date()) {
      const retryAfter = Math.ceil((account.cooldownUntil.getTime() - Date.now()) / 1000);
      return { 
        allowed: false, 
        reason: 'Account is in cooldown due to rate limiting',
        retryAfter 
      };
    }

    // Count successful actions in different time windows
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    let actionsLastHour = 0;
    let actionsLastDay = 0;

    // Count from all running campaigns using sentCount
    for (const campaign of account.campaigns) {
      // Use sentCount directly from campaign
      const sentInWindow = campaign.sentCount || 0;
      
      // For hourly check, only count if campaign started within last hour
      if (campaign.startedAt && campaign.startedAt >= oneHourAgo) {
        actionsLastHour += sentInWindow;
      }
      
      // For daily check, add all sent in this campaign (already filtered by 24h in query)
      actionsLastDay += sentInWindow;
    }

    // Get rate limits (from campaign defaults or account settings)
    const maxPerHour = account.rateLimitPerHour || defaultLimits.maxPerHour || 20;
    const maxPerDay = account.rateLimitPerDay || defaultLimits.maxPerDay || 200;

    this.logger.log(`Rate limit check for account ${account.handle}: ${actionsLastHour}/${maxPerHour} per hour, ${actionsLastDay}/${maxPerDay} per day`);

    // Check hourly limit
    if (actionsLastHour >= maxPerHour) {
      return { 
        allowed: false, 
        reason: `Hourly rate limit exceeded (${actionsLastHour}/${maxPerHour})` 
      };
    }

    // Check daily limit
    if (actionsLastDay >= maxPerDay) {
      return { 
        allowed: false, 
        reason: `Daily rate limit exceeded (${actionsLastDay}/${maxPerDay})` 
      };
    }

    // Warning thresholds (80% of limits)
    if (actionsLastHour >= maxPerHour * 0.8) {
      this.logger.warn(`Account ${account.handle} approaching hourly rate limit: ${actionsLastHour}/${maxPerHour}`);
    }

    if (actionsLastDay >= maxPerDay * 0.8) {
      this.logger.warn(`Account ${account.handle} approaching daily rate limit: ${actionsLastDay}/${maxPerDay}`);
    }

    return { allowed: true };
  }

  async recordRateLimitHit(accountId: string, reason: string): Promise<void> {
    const cooldownMinutes = 60; // Default cooldown
    
    // Put account in cooldown
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        cooldownUntil: new Date(Date.now() + cooldownMinutes * 60 * 1000),
        lastError: `Rate limited: ${reason}`
      }
    });

    this.logger.warn(`Account ${accountId} put in cooldown for ${cooldownMinutes} minutes: ${reason}`);
  }

  async clearCooldown(accountId: string): Promise<void> {
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        cooldownUntil: null,
        lastError: null
      }
    });

    this.logger.log(`Cooldown cleared for account ${accountId}`);
  }

  async getAccountStats(accountId: string): Promise<{
    actionsLastHour: number;
    actionsLastDay: number;
    inCooldown: boolean;
    cooldownUntil?: Date;
  }> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        campaigns: {
          where: {
            startedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    let actionsLastHour = 0;
    let actionsLastDay = 0;

    for (const campaign of account.campaigns) {
      const sentInWindow = campaign.sentCount || 0;
      
      if (campaign.startedAt && campaign.startedAt >= oneHourAgo) {
        actionsLastHour += sentInWindow;
      }
      
      actionsLastDay += sentInWindow;
    }

    return {
      actionsLastHour,
      actionsLastDay,
      inCooldown: !!(account.cooldownUntil && account.cooldownUntil > new Date()),
      cooldownUntil: account.cooldownUntil || undefined
    };
  }
}
