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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsController = void 0;
const common_1 = require("@nestjs/common");
const campaigns_service_1 = require("./campaigns.service");
const create_campaign_dto_1 = require("./dto/create-campaign.dto");
const queue_service_1 = require("../queue/queue.service");
let CampaignsController = class CampaignsController {
    constructor(campaignsService, queueService) {
        this.campaignsService = campaignsService;
        this.queueService = queueService;
    }
    async create(createCampaignDto) {
        try {
            console.log('CAMPAIGN CREATE - Received DTO:', createCampaignDto);
            const { id, campaignId, ...cleanDto } = createCampaignDto;
            const campaign = await this.campaignsService.create(cleanDto);
            let jobId = null;
            try {
                jobId = await this.queueService.addJob({
                    campaignId: campaign.id,
                    accountId: cleanDto.accountId,
                    type: cleanDto.type,
                    message: cleanDto.message,
                    targets: cleanDto.targets,
                    templateId: campaign.template?.id,
                });
            }
            catch (queueError) {
                console.error('CAMPAIGN CREATE - Failed to enqueue campaign:', queueError);
            }
            console.log('CAMPAIGN CREATE - Created campaign:', campaign);
            let totalTargets = 0;
            try {
                const targets = campaign.targetsJson ? JSON.parse(campaign.targetsJson) : [];
                totalTargets = targets.length;
            }
            catch (e) {
                console.error('Failed to parse targets:', e);
            }
            return {
                id: campaign.id,
                name: campaign.name,
                type: campaign.type.toLowerCase(),
                status: campaign.status.toLowerCase(),
                message: campaign.template?.body || '',
                targetList: [],
                createdAt: campaign.createdAt.toISOString(),
                startedAt: campaign.startedAt?.toISOString() || null,
                completedAt: campaign.completedAt?.toISOString() || null,
                totalTargets,
                sentCount: campaign.sentCount || 0,
                successCount: campaign.successCount || 0,
                failureCount: 0,
                successRate: 0,
                jobId,
            };
        }
        catch (error) {
            console.error('CAMPAIGN CREATE ERROR:', error);
            console.error('CAMPAIGN CREATE ERROR DETAILS:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack available',
                dto: createCampaignDto
            });
            throw new common_1.HttpException({
                error: 'Failed to create campaign',
                details: error instanceof Error ? error.message : 'Unknown error',
                receivedData: createCampaignDto
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll() {
        const campaigns = await this.campaignsService.findAll();
        return campaigns.map((campaign) => {
            let totalTargets = 0;
            try {
                const targets = campaign.targetsJson ? JSON.parse(campaign.targetsJson) : [];
                totalTargets = targets.length;
            }
            catch (e) {
            }
            const sentCount = campaign.sentCount || 0;
            const successCount = campaign.successCount || 0;
            const successRate = sentCount > 0 ? (successCount / sentCount) * 100 : 0;
            return {
                id: campaign.id,
                name: campaign.name,
                type: campaign.type.toLowerCase(),
                status: campaign.status.toLowerCase(),
                message: campaign.template?.body || '',
                targetList: [],
                createdAt: campaign.createdAt.toISOString(),
                startedAt: campaign.startedAt?.toISOString() || null,
                completedAt: campaign.completedAt?.toISOString() || null,
                totalTargets,
                sentCount,
                successCount,
                failureCount: sentCount - successCount,
                successRate,
            };
        });
    }
    async remove(id) {
        try {
            await this.campaignsService.remove(id);
            return { message: 'Campaign deleted successfully' };
        }
        catch (error) {
            throw new common_1.HttpException('Failed to delete campaign', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.CampaignsController = CampaignsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_campaign_dto_1.CreateCampaignDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "remove", null);
exports.CampaignsController = CampaignsController = __decorate([
    (0, common_1.Controller)('campaigns'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => queue_service_1.QueueService))),
    __metadata("design:paramtypes", [campaigns_service_1.CampaignsService,
        queue_service_1.QueueService])
], CampaignsController);
//# sourceMappingURL=campaigns.controller.js.map