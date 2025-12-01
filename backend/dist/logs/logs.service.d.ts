import { PrismaService } from '../prisma/prisma.service';
interface FindAllParams {
    page: number;
    limit: number;
    level?: string;
    campaignId?: string;
    accountId?: string;
}
export declare class LogsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: FindAllParams): Promise<({
        account: {
            handle: string;
        } | null;
        campaign: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        message: string;
        accountId: string | null;
        level: string;
        metadata: string | null;
        campaignId: string | null;
    })[]>;
    findRecent(limit?: number): Promise<({
        account: {
            handle: string;
        } | null;
        campaign: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        message: string;
        accountId: string | null;
        level: string;
        metadata: string | null;
        campaignId: string | null;
    })[]>;
    getStats(): Promise<{
        total: number;
        info: number;
        warn: number;
        error: number;
    }>;
    create(data: {
        level?: 'INFO' | 'WARN' | 'ERROR';
        message: string;
        accountId?: string;
        campaignId?: string;
        targetId?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        accountId: string | null;
        level: string;
        metadata: string | null;
        campaignId: string | null;
    }>;
}
export {};
