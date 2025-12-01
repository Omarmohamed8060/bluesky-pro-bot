import { PrismaService } from '../prisma/prisma.service';
interface StatsResponse {
    totalAccounts: number;
    activeAccounts: number;
    activeCampaigns: number;
    totalSent: number;
    failedCount: number;
}
export declare class StatsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<StatsResponse>;
}
export {};
