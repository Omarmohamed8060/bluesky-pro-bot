import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { QueueService } from '../queue/queue.service';
export declare class CampaignsController {
    private readonly campaignsService;
    private readonly queueService;
    constructor(campaignsService: CampaignsService, queueService: QueueService);
    create(createCampaignDto: CreateCampaignDto): Promise<{
        id: string;
        name: string;
        type: string;
        status: string;
        message: string;
        targetList: never[];
        createdAt: string;
        startedAt: string | null;
        completedAt: string | null;
        totalTargets: number;
        sentCount: number;
        successCount: number;
        failureCount: number;
        successRate: number;
        jobId: string | null;
    }>;
    findAll(): Promise<{
        id: any;
        name: any;
        type: any;
        status: any;
        message: any;
        targetList: never[];
        createdAt: any;
        startedAt: any;
        completedAt: any;
        totalTargets: number;
        sentCount: any;
        successCount: any;
        failureCount: number;
        successRate: number;
    }[]>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
