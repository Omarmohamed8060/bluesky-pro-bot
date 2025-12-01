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
var CampaignsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CampaignsService = CampaignsService_1 = class CampaignsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CampaignsService_1.name);
    }
    async create(createCampaignDto) {
        const { name, type, message, targets, accountId } = createCampaignDto;
        this.logger.log(`Creating campaign: ${name} (${type}) with ${targets?.length || 0} targets`);
        if (!name || !type || !message || !targets || !accountId) {
            throw new Error('Missing required fields for campaign creation');
        }
        if (!Array.isArray(targets) || targets.length === 0) {
            throw new Error('Targets must be a non-empty array');
        }
        const validTargets = targets.filter(target => {
            const trimmed = target?.trim();
            return trimmed && (trimmed.endsWith('.bsky.social') || trimmed.startsWith('did:'));
        });
        if (validTargets.length === 0) {
            throw new Error('Targets must contain at least one valid Bluesky handle or DID');
        }
        const account = await this.prisma.account.findUnique({
            where: { id: accountId }
        });
        if (!account) {
            throw new Error(`Account not found with ID: ${accountId}`);
        }
        try {
            const template = await this.prisma.template.create({
                data: {
                    name: `${name} Template`,
                    type: type === 'dm' ? 'DM' : 'POST',
                    body: message,
                },
            });
            const campaign = await this.prisma.campaign.create({
                data: {
                    name,
                    accountId,
                    templateId: template.id,
                    targetsJson: JSON.stringify(validTargets),
                    type: type === 'dm' ? 'DM' : 'POST',
                    status: 'QUEUED',
                    maxPerHour: 20,
                    maxPerDay: 200,
                },
                include: {
                    template: true,
                    account: true,
                },
            });
            this.logger.log(`Campaign created successfully: ${campaign.id}`);
            return campaign;
        }
        catch (error) {
            this.logger.error('Failed to create campaign:', error);
            throw new Error(`Failed to create campaign: ${error.message}`);
        }
    }
    async findAll() {
        return this.prisma.campaign.findMany({
            include: {
                template: true,
                account: true,
                _count: {
                    select: {
                        logs: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
            include: {
                template: true,
                account: true,
                logs: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 50,
                }
            }
        });
        if (!campaign) {
            throw new Error(`Campaign not found: ${id}`);
        }
        let parsedTargets = [];
        if (campaign.targetsJson) {
            try {
                parsedTargets = JSON.parse(campaign.targetsJson);
            }
            catch (error) {
                this.logger.warn(`Failed to parse targets for campaign ${id}`);
            }
        }
        return {
            ...campaign,
            targets: parsedTargets,
        };
    }
    async updateStatus(id, status) {
        const updateData = { status };
        if (status === 'RUNNING') {
            updateData.startedAt = new Date();
        }
        else if (status === 'COMPLETED' || status === 'COOLDOWN') {
            updateData.completedAt = new Date();
        }
        return this.prisma.campaign.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id) {
        return this.prisma.campaign.delete({
            where: { id },
        });
    }
    processTemplate(template, variables) {
        let processed = template;
        const replacements = {
            '{{username}}': variables.username || variables.handle || '',
            '{{name}}': variables.displayName || variables.name || '',
            '{{link}}': variables.link || '',
            '{{custom}}': variables.custom || '',
        };
        for (const [placeholder, value] of Object.entries(replacements)) {
            processed = processed.replace(new RegExp(placeholder, 'g'), value);
        }
        return processed;
    }
    async getStats(id) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
            include: {
                logs: true,
                _count: {
                    select: {
                        logs: true,
                    }
                }
            }
        });
        if (!campaign) {
            throw new Error(`Campaign not found: ${id}`);
        }
        const totalLogs = campaign._count.logs;
        const successLogs = campaign.logs.filter(log => log.level === 'INFO').length;
        const failureLogs = campaign.logs.filter(log => log.level === 'ERROR').length;
        const targets = campaign.targetsJson ? JSON.parse(campaign.targetsJson) : [];
        return {
            totalTargets: targets.length,
            totalLogs,
            successCount: successLogs,
            failureCount: failureLogs,
            successRate: totalLogs > 0 ? (successLogs / totalLogs) * 100 : 0,
            status: campaign.status,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
        };
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = CampaignsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map