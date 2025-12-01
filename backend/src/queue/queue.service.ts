import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly queueProcessor: QueueProcessor) {}

  async addJob(request: QueueJobRequest): Promise<string> {
    const jobId = `job-${Date.now()}`;
    this.logger.log(
      `QueueService: scheduling ${request.type.toUpperCase()} campaign ${request.campaignId} with ${request.targets.length} targets (job ${jobId})`,
    );

    await this.queueProcessor.processJob({
      campaignId: request.campaignId,
      accountId: request.accountId,
      type: request.type,
      message: request.message,
      targets: request.targets,
      templateId: request.templateId,
    });

    return jobId;
  }
}
