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
var DmQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DmQueueProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const queue_constants_1 = require("./queue.constants");
const bluesky_service_1 = require("../bluesky/bluesky.service");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let DmQueueProcessor = DmQueueProcessor_1 = class DmQueueProcessor extends bullmq_1.WorkerHost {
    constructor(blueskyService, prisma, redisService) {
        super();
        this.blueskyService = blueskyService;
        this.prisma = prisma;
        this.redisService = redisService;
        this.logger = new common_1.Logger(DmQueueProcessor_1.name);
        this.redis = this.redisService.getClient();
    }
    async process(job) {
        if (job.name !== queue_constants_1.DM_JOB_NAME) {
            this.logger.warn(`Ignoring unknown job name: ${job.name}`);
            return;
        }
        const payload = job.data;
        const credentials = await this.blueskyService.getAccountCredentials(payload.accountId);
        await this.withAccountLock(payload.accountId, async () => {
            await this.handleAttempt(payload, job.id, credentials);
        });
    }
    async handleAttempt(payload, jobId, credentials) {
        try {
            await this.blueskyService.sendDM(payload, credentials);
            await this.recordSuccess(payload, jobId);
        }
        catch (error) {
            await this.recordFailure(payload, jobId, error);
            this.logger.error(`DM job failed for campaign ${payload.campaignId} target ${payload.targetId}: ${error.message}`);
            throw error;
        }
    }
    async recordSuccess(payload, jobId) {
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
    async recordFailure(payload, jobId, error) {
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
    async withAccountLock(accountId, handler) {
        const key = this.accountLockKey(accountId);
        while (true) {
            const acquired = await this.redis.set(key, '1', 'EX', DmQueueProcessor_1.ACCOUNT_LOCK_TTL_MS / 1000, 'NX');
            if (acquired) {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        try {
            return await handler();
        }
        finally {
            await this.redis.del(key);
        }
    }
    accountLockKey(accountId) {
        return `queue:lock:account:${accountId}`;
    }
};
exports.DmQueueProcessor = DmQueueProcessor;
DmQueueProcessor.ACCOUNT_LOCK_TTL_MS = 60_000;
exports.DmQueueProcessor = DmQueueProcessor = DmQueueProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, bullmq_1.Processor)(queue_constants_1.DM_QUEUE, {
        concurrency: 5,
    }),
    __metadata("design:paramtypes", [bluesky_service_1.BlueskyService,
        prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], DmQueueProcessor);
//# sourceMappingURL=queue.processor.js.map