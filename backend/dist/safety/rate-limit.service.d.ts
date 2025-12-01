import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
export declare class RateLimitService {
    private readonly prisma;
    private readonly settingsService;
    private readonly logger;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    checkRateLimit(accountId: string, action: 'DM' | 'POST'): Promise<{
        allowed: boolean;
        reason?: string;
        retryAfter?: number;
    }>;
    recordRateLimitHit(accountId: string, reason: string): Promise<void>;
    clearCooldown(accountId: string): Promise<void>;
    getAccountStats(accountId: string): Promise<{
        actionsLastHour: number;
        actionsLastDay: number;
        inCooldown: boolean;
        cooldownUntil?: Date;
    }>;
}
