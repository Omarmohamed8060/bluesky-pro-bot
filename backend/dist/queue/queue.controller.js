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
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const queue_processor_service_1 = require("./queue-processor.service");
const start_campaign_dto_1 = require("./dto/start-campaign.dto");
const campaigns_service_1 = require("../campaigns/campaigns.service");
let QueueController = class QueueController {
    constructor(queueProcessor, campaignsService) {
        this.queueProcessor = queueProcessor;
        this.campaignsService = campaignsService;
    }
    async startCampaign(startCampaignDto) {
        try {
            console.log('QUEUE CONTROLLER - Starting campaign with DTO:', startCampaignDto);
            if (!startCampaignDto.campaignId) {
                throw new Error('campaignId is required');
            }
            const campaign = await this.campaignsService.findOne(startCampaignDto.campaignId);
            if (!campaign) {
                throw new Error(`Campaign not found: ${startCampaignDto.campaignId}`);
            }
            if (campaign.status !== 'QUEUED' && campaign.status !== 'DRAFT') {
                throw new Error(`Campaign cannot be started. Current status: ${campaign.status}`);
            }
            console.log('QUEUE CONTROLLER - DTO validation passed');
            await this.campaignsService.updateStatus(startCampaignDto.campaignId, 'RUNNING');
            console.log('QUEUE CONTROLLER - Calling queueProcessor.processJob...');
            await this.queueProcessor.processJob(startCampaignDto);
            console.log('QUEUE CONTROLLER - Campaign processed successfully');
            return {
                success: true,
                message: 'Campaign started and processed successfully',
                campaignId: startCampaignDto.campaignId,
                jobId: `job-${Date.now()}`,
            };
        }
        catch (error) {
            console.error('QUEUE CONTROLLER - ERROR:', error);
            console.error('QUEUE CONTROLLER - ERROR TYPE:', typeof error);
            console.error('QUEUE CONTROLLER - ERROR MESSAGE:', error?.message);
            console.error('QUEUE CONTROLLER - ERROR STACK:', error?.stack);
            console.error('QUEUE CONTROLLER - DTO RECEIVED:', startCampaignDto);
            throw new common_1.HttpException({
                error: 'Failed to start campaign',
                details: error?.message || 'Unknown error occurred',
                type: typeof error,
                receivedData: startCampaignDto
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Post)('add'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_campaign_dto_1.StartCampaignDto]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "startCampaign", null);
exports.QueueController = QueueController = __decorate([
    (0, common_1.Controller)('queue'),
    __metadata("design:paramtypes", [queue_processor_service_1.QueueProcessor,
        campaigns_service_1.CampaignsService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map