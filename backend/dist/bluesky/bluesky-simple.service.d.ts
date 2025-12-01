import { PrismaService } from '../prisma/prisma.service';
export declare class BlueskyService {
    private readonly prisma;
    private readonly logger;
    private readonly serviceUrl;
    constructor(prisma: PrismaService);
    sendPost(accountId: string, text: string): Promise<{
        uri: string;
        cid: string;
    }>;
    sendDM(accountId: string, targetHandle: string, message: string): Promise<void>;
    private getAccountCredentials;
    private updateAccountLastLogin;
    testAccountConnection(accountId: string): Promise<boolean>;
}
