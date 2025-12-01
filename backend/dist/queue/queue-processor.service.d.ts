import { PrismaService } from '../prisma/prisma.service';
import { BlueskyService } from '../bluesky/bluesky.service';
import { RateLimitService } from '../safety/rate-limit.service';
import { TemplatesService } from '../templates/templates.service';
import { SettingsService } from '../settings/settings.service';
export declare class QueueProcessor {
    private readonly prisma;
    private readonly blueskyService;
    private readonly rateLimitService;
    private readonly templatesService;
    private readonly settingsService;
    private readonly logger;
    constructor(prisma: PrismaService, blueskyService: BlueskyService, rateLimitService: RateLimitService, templatesService: TemplatesService, settingsService: SettingsService);
    processJob(jobData: any): Promise<{
        success: boolean;
        error: string;
        nextAvailable: Date | undefined;
        results?: undefined;
        totalProcessed?: undefined;
        successCount?: undefined;
        failureCount?: undefined;
    } | {
        success: boolean;
        results: ({
            success: boolean;
            target: any;
            messageId: any;
            error?: undefined;
        } | {
            success: boolean;
            target: any;
            error: any;
            messageId?: undefined;
        })[];
        totalProcessed: number;
        successCount: number;
        failureCount: number;
        error?: undefined;
        nextAvailable?: undefined;
    }>;
    private processTarget;
    private delay;
}
