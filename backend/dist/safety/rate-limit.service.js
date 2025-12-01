"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RateLimitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const settings_service_1 = require("../settings/settings.service");
let RateLimitService = RateLimitService_1 = class RateLimitService {
    constructor(prisma, settingsService) {
        this.prisma = prisma;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(RateLimitService_1.name);
    }
    async checkRateLimit(accountId, action) {
        const [account, coreSettings] = await Promise.all([
            this.prisma.account.findUnique({
                where: { id: accountId },
                include: {
                    campaigns: {
                        where: {
                            type: action === 'DM' ? 'DM' : 'POST',
                            status: 'RUNNING',
                            startedAt: {
                                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
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
        const defaultLimits = {
            maxPerHour: coreSettings.maxDmsPerHour,
            maxPerDay: coreSettings.maxDmsPerDay,
            cooldownMinutesOn429: 60,
        };
        if (account.cooldownUntil && account.cooldownUntil > new Date()) {
            const retryAfter = Math.ceil((account.cooldownUntil.getTime() - Date.now()) / 1000);
            return {
                allowed: false,
                reason: 'Account is in cooldown due to rate limiting',
                retryAfter
            };
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
        const maxPerHour = account.rateLimitPerHour || defaultLimits.maxPerHour || 20;
        const maxPerDay = account.rateLimitPerDay || defaultLimits.maxPerDay || 200;
        this.logger.log(`Rate limit check for account ${account.handle}: ${actionsLastHour}/${maxPerHour} per hour, ${actionsLastDay}/${maxPerDay} per day`);
        if (actionsLastHour >= maxPerHour) {
            return {
                allowed: false,
                reason: `Hourly rate limit exceeded (${actionsLastHour}/${maxPerHour})`
            };
        }
        if (actionsLastDay >= maxPerDay) {
            return {
                allowed: false,
                reason: `Daily rate limit exceeded (${actionsLastDay}/${maxPerDay})`
            };
        }
        if (actionsLastHour >= maxPerHour * 0.8) {
            this.logger.warn(`Account ${account.handle} approaching hourly rate limit: ${actionsLastHour}/${maxPerHour}`);
        }
        if (actionsLastDay >= maxPerDay * 0.8) {
            this.logger.warn(`Account ${account.handle} approaching daily rate limit: ${actionsLastDay}/${maxPerDay}`);
        }
        return { allowed: true };
    }
    async recordRateLimitHit(accountId, reason) {
        const cooldownMinutes = 60;
        await this.prisma.account.update({
            where: { id: accountId },
            data: {
                cooldownUntil: new Date(Date.now() + cooldownMinutes * 60 * 1000),
                lastError: `Rate limited: ${reason}`
            }
        });
        this.logger.warn(`Account ${accountId} put in cooldown for ${cooldownMinutes} minutes: ${reason}`);
    }
    async clearCooldown(accountId) {
        await this.prisma.account.update({
            where: { id: accountId },
            data: {
                cooldownUntil: null,
                lastError: null
            }
        });
        this.logger.log(`Cooldown cleared for account ${accountId}`);
    }
    async getAccountStats(accountId) {
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
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = RateLimitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map