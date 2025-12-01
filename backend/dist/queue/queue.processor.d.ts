import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DmJobPayload } from './job.types';
import { BlueskyService } from '../bluesky/bluesky.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class DmQueueProcessor extends WorkerHost {
    private readonly blueskyService;
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    private readonly redis;
    private static readonly ACCOUNT_LOCK_TTL_MS;
    constructor(blueskyService: BlueskyService, prisma: PrismaService, redisService: RedisService);
    process(job: Job<DmJobPayload, void, string>): Promise<void>;
    private handleAttempt;
    private recordSuccess;
    private recordFailure;
    private withAccountLock;
    private accountLockKey;
}
