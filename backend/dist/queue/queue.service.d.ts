import { QueueProcessor } from './queue-processor.service';
export type QueueType = 'dm' | 'post';
export interface QueueJobRequest {
    campaignId: string;
    accountId: string;
    type: QueueType;
    message: string;
    targets: string[];
    templateId?: string;
}
export declare class QueueService {
    private readonly queueProcessor;
    private readonly logger;
    constructor(queueProcessor: QueueProcessor);
    addJob(request: QueueJobRequest): Promise<string>;
}
