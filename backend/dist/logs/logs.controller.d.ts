import { LogsService } from './logs.service';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findRecent(limit?: string): Promise<({
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
}
