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
var QueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueProcessor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bluesky_service_1 = require("../bluesky/bluesky.service");
const rate_limit_service_1 = require("../safety/rate-limit.service");
const templates_service_1 = require("../templates/templates.service");
const settings_service_1 = require("../settings/settings.service");
let QueueProcessor = QueueProcessor_1 = class QueueProcessor {
    constructor(prisma, blueskyService, rateLimitService, templatesService, settingsService) {
        this.prisma = prisma;
        this.blueskyService = blueskyService;
        this.rateLimitService = rateLimitService;
        this.templatesService = templatesService;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(QueueProcessor_1.name);
    }
    async processJob(jobData) {
        console.log('🚀 [QUEUE PROCESSOR] Starting job processing:', {
            campaignId: jobData.campaignId,
            type: jobData.type,
            accountId: jobData.accountId,
            targetsCount: jobData.targets?.length || 0
        });
        const { type, accountId, targets, message, campaignId, templateId } = jobData;
        if (!campaignId) {
            throw new Error('campaignId is required for job processing');
        }
        if (!type || !accountId) {
            throw new Error('type and accountId are required for job processing');
        }
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                account: true,
                template: true,
                targetList: true
            }
        });
        if (!campaign) {
            throw new Error(`Campaign not found: ${campaignId}`);
        }
        this.logger.log(`Starting campaign processing: ${campaignId} (${type})`);
        try {
            const credentials = await this.blueskyService.getAccountCredentials(accountId);
            const account = credentials.account;
            this.logger.log(`Processing with account: ${account.handle}`);
            const actionType = campaign.type ?? 'DM';
            const rateLimitResult = await this.rateLimitService.checkRateLimit(accountId, actionType);
            if (!rateLimitResult.allowed) {
                this.logger.warn(`Rate limit exceeded for account ${account.handle}. Next available: ${rateLimitResult.nextAvailable}`);
                await this.prisma.logEntry.create({
                    data: {
                        level: 'WARN',
                        accountId,
                        campaignId,
                        message: `Rate limit exceeded for account ${account.handle}`,
                        metadata: { nextAvailable: rateLimitResult.nextAvailable }
                    }
                });
                return {
                    success: false,
                    error: 'Rate limit exceeded',
                    nextAvailable: rateLimitResult.nextAvailable
                };
            }
            let parsedTargets = targets;
            if (!parsedTargets && campaign.targetsJson) {
                parsedTargets = JSON.parse(campaign.targetsJson || '[]');
            }
            else if (!parsedTargets && campaign.targetListId) {
                const targetList = await this.prisma.targetList.findUnique({
                    where: { id: campaign.targetListId }
                });
                if (targetList && targetList.targetsJson) {
                    parsedTargets = JSON.parse(targetList.targetsJson || '[]');
                }
            }
            if (!parsedTargets || parsedTargets.length === 0) {
                throw new Error('No targets found for campaign');
            }
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: {
                    status: 'RUNNING',
                    startedAt: new Date()
                }
            });
            await this.prisma.logEntry.create({
                data: {
                    level: 'INFO',
                    message: `Starting ${type} campaign for ${parsedTargets.length} targets using account ${account.handle}`,
                    accountId,
                    campaignId,
                    metadata: {
                        campaignType: type,
                        targetCount: parsedTargets.length
                    }
                }
            });
            this.logger.log(`Processing ${parsedTargets.length} targets`);
            const coreSettings = await this.settingsService.getCoreSettings();
            const delayMs = Math.max(0, Math.round(coreSettings.delayBetweenActions * 1000));
            const results = [];
            for (const target of parsedTargets) {
                const result = await this.processTarget(campaign, account, target, message, templateId, credentials);
                results.push(result);
                if (delayMs > 0) {
                    await this.delay(delayMs);
                }
            }
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });
            console.log('✅ [QUEUE PROCESSOR] Campaign completed:', {
                campaignId,
                totalTargets: parsedTargets.length,
                successCount: results.filter(r => r.success).length,
                failureCount: results.filter(r => !r.success).length
            });
            this.logger.log(`Campaign ${campaignId} completed successfully`);
            return {
                success: true,
                results,
                totalProcessed: results.length,
                successCount: results.filter(r => r.success).length,
                failureCount: results.filter(r => !r.success).length
            };
        }
        catch (error) {
            this.logger.error(`Campaign processing failed: ${error.message}`, error.stack);
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: {
                    status: 'FAILED',
                    completedAt: new Date()
                }
            });
            throw error;
        }
    }
    async processTarget(campaign, account, target, message, templateId, credentials) {
        const targetId = typeof target === 'string' ? target : target.id || target.handle;
        try {
            let targetData;
            if (typeof target === 'string') {
                targetData = { handle: target };
            }
            else {
                targetData = target;
            }
            this.logger.log(`Processing target: ${targetData.handle}`);
            let finalMessage = message;
            if (templateId) {
                const variables = {
                    username: targetData.handle || targetData.displayName || 'there',
                    displayName: targetData.displayName || targetData.handle || 'there',
                    handle: targetData.handle || '',
                };
                finalMessage = await this.templatesService.renderTemplate(templateId, variables);
            }
            if (campaign.type === 'POST' && targetData.handle) {
                const mentionHandle = `@${targetData.handle.replace(/^@/, '')}`;
                if (!finalMessage.includes(mentionHandle)) {
                    finalMessage = `${mentionHandle} ${finalMessage}`.trim();
                }
            }
            let result;
            if (campaign.type === 'DM') {
                const dmPayload = {
                    accountId: account.id,
                    campaignId: campaign.id,
                    campaignTargetId: `temp-${Date.now()}`,
                    targetId: targetId,
                    targetHandle: targetData.handle,
                    templateId: templateId || 'default',
                    logId: `log-${Date.now()}`,
                    message: finalMessage,
                    renderContext: {
                        username: targetData.handle || targetData.displayName || 'there',
                        displayName: targetData.displayName || targetData.handle || 'there',
                        handle: targetData.handle || '',
                    }
                };
                result = await this.blueskyService.sendDM(dmPayload, credentials);
            }
            else if (campaign.type === 'POST') {
                const postPayload = {
                    accountId: account.id,
                    campaignId: campaign.id,
                    campaignTargetId: `temp-${Date.now()}`,
                    targetId: targetId,
                    targetHandle: targetData.handle,
                    templateId: templateId || 'default',
                    logId: `log-${Date.now()}`,
                    message: finalMessage,
                    renderContext: {
                        username: targetData.handle || targetData.displayName || 'there',
                        displayName: targetData.displayName || targetData.handle || 'there',
                        handle: targetData.handle || '',
                    }
                };
                result = await this.blueskyService.sendPost(postPayload, credentials);
            }
            await this.prisma.campaign.update({
                where: { id: campaign.id },
                data: {
                    sentCount: { increment: 1 },
                    successCount: { increment: 1 },
                },
            });
            const metadata = {
                campaignType: campaign.type,
                targetHandle: targetData.handle,
            };
            if (campaign.type === 'POST' && result && typeof result === 'object') {
                const postResult = result;
                if (postResult.id) {
                    metadata.messageId = postResult.id;
                }
                if (postResult.uri) {
                    metadata.messageUri = postResult.uri;
                }
                if (postResult.cid) {
                    metadata.messageCid = postResult.cid;
                }
            }
            if (campaign.type === 'DM' && result && typeof result === 'object') {
                const dmResult = result;
                if (dmResult.messageId) {
                    metadata.messageId = dmResult.messageId;
                }
                if (dmResult.convoId) {
                    metadata.conversationId = dmResult.convoId;
                }
                if (dmResult.targetDid) {
                    metadata.targetDid = dmResult.targetDid;
                }
                if (dmResult.targetHandle && !metadata.targetHandle) {
                    metadata.targetHandle = dmResult.targetHandle;
                }
            }
            await this.prisma.logEntry.create({
                data: {
                    level: 'INFO',
                    accountId: account.id,
                    campaignId: campaign.id,
                    message: `Successfully sent ${campaign.type.toLowerCase()} to ${targetData.handle}`,
                    metadata: metadata,
                },
            });
            console.log('✅ [QUEUE PROCESSOR] Target processed successfully:', {
                campaignId: campaign.id,
                targetHandle: targetData.handle,
                sentCount: campaign.sentCount + 1
            });
            this.logger.log(`Successfully sent ${campaign.type.toLowerCase()} to ${targetData.handle}`);
            return {
                success: true,
                target: targetData,
                messageId: result?.id
            };
        }
        catch (error) {
            await this.prisma.campaign.update({
                where: { id: campaign.id },
                data: {
                    sentCount: { increment: 1 },
                },
            });
            let targetData;
            if (typeof target === 'string') {
                targetData = { handle: target };
            }
            else {
                targetData = target;
            }
            await this.prisma.logEntry.create({
                data: {
                    level: 'ERROR',
                    accountId: account.id,
                    campaignId: campaign.id,
                    message: `Failed to send ${campaign.type.toLowerCase()} to ${targetData.handle}: ${error.message}`,
                    metadata: {
                        campaignType: campaign.type,
                        targetHandle: targetData.handle,
                        error: error.message
                    }
                }
            });
            console.error('💥 [QUEUE PROCESSOR] Target processing failed:', {
                campaignId: campaign.id,
                targetHandle: targetData.handle,
                error: error.message,
                stack: error.stack
            });
            this.logger.error(`Failed to send ${campaign.type.toLowerCase()} to ${targetData.handle}: ${error.message}`);
            return {
                success: false,
                target: targetData,
                error: error.message
            };
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.QueueProcessor = QueueProcessor;
exports.QueueProcessor = QueueProcessor = QueueProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bluesky_service_1.BlueskyService,
        rate_limit_service_1.RateLimitService,
        templates_service_1.TemplatesService,
        settings_service_1.SettingsService])
], QueueProcessor);
//# sourceMappingURL=queue-processor.service.js.map