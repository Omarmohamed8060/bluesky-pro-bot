import { QueueProcessor } from './queue-processor.service';
import { StartCampaignDto } from './dto/start-campaign.dto';
import { CampaignsService } from '../campaigns/campaigns.service';
export declare class QueueController {
    private readonly queueProcessor;
    private readonly campaignsService;
    constructor(queueProcessor: QueueProcessor, campaignsService: CampaignsService);
    startCampaign(startCampaignDto: StartCampaignDto): Promise<{
        success: boolean;
        message: string;
        campaignId: string;
        jobId: string;
    }>;
}
