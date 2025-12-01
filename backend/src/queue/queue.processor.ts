import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DmJobPayload } from './job.types';
import { DM_JOB_NAME, DM_QUEUE } from './queue.constants';
import { BlueskyService } from '../bluesky/bluesky.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
@Processor(DM_QUEUE, {
  concurrency: 5,
})
export class DmQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(DmQueueProcessor.name);
  private readonly redis = this.redisService.getClient();
  private static readonly ACCOUNT_LOCK_TTL_MS = 60_000;

  constructor(
    private readonly blueskyService: BlueskyService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job<DmJobPayload, void, string>): Promise<void> {
    if (job.name !== DM_JOB_NAME) {
      this.logger.warn(`Ignoring unknown job name: ${job.name}`);
      return;
    }

    const payload = job.data;
    const credentials = await this.blueskyService.getAccountCredentials(payload.accountId);

    await this.withAccountLock(payload.accountId, async () => {
      await this.handleAttempt(payload, job.id as string, credentials);
    });
  }

  private async handleAttempt(
    payload: DmJobPayload,
    jobId: string,
    credentials: Awaited<ReturnType<BlueskyService['getAccountCredentials']>>,
  ): Promise<void> {
    try {
      await this.blueskyService.sendDM(payload, credentials);
      await this.recordSuccess(payload, jobId);
    } catch (error) {
      await this.recordFailure(payload, jobId, error as Error);
      this.logger.error(
        `DM job failed for campaign ${payload.campaignId} target ${payload.targetId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private async recordSuccess(payload: DmJobPayload, jobId: string): Promise<void> {
    await this.prisma.logEntry.create({
      data: {
        level: 'INFO',
        message: 'Message sent successfully',
        campaignId: payload.campaignId,
        accountId: payload.accountId,
        metadata: JSON.stringify({ jobId }),
      },
    });
  }

  private async recordFailure(payload: DmJobPayload, jobId: string, error: Error): Promise<void> {
    await this.prisma.logEntry.create({
      data: {
        level: 'ERROR',
        message: error.message,
        metadata: JSON.stringify({
          jobId,
          targetId: payload.targetId,
        }),
      },
    });
  }

  private async withAccountLock<T>(accountId: string, handler: () => Promise<T>): Promise<T> {
    const key = this.accountLockKey(accountId);

    while (true) {
      const acquired = await this.redis.set(key, '1', 'EX', DmQueueProcessor.ACCOUNT_LOCK_TTL_MS / 1000, 'NX');
      if (acquired) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    try {
      return await handler();
    } finally {
      await this.redis.del(key);
    }
  }

  private accountLockKey(accountId: string): string {
    return `queue:lock:account:${accountId}`;
  }
}
