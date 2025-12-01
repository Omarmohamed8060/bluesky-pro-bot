import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../security/encryption.service';
import { DmJobPayload, PostJobPayload } from '../queue/job.types';
interface AccountCredentials {
    account: Account;
    handle: string;
    password: string;
}
export { AccountCredentials };
export interface SendDmResult {
    convoId: string;
    messageId: string | null;
    targetDid: string;
    targetHandle: string;
}
export interface FollowResult {
    success: boolean;
    handle: string;
    did: string;
    detail: string;
}
export interface FollowerInfo {
    handle: string;
    did: string;
    displayName?: string;
    createdAt?: string;
    description?: string;
}
export declare class BlueskyService implements OnModuleInit {
    private readonly prisma;
    private readonly encryptionService;
    private readonly configService;
    private readonly logger;
    private readonly defaultServiceUrl;
    private readonly sharedIdentifier?;
    private readonly sharedAppPassword?;
    private sharedAgent;
    private sharedSession;
    constructor(prisma: PrismaService, encryptionService: EncryptionService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    followUser(handle: string, credentials?: AccountCredentials): Promise<FollowResult>;
    getFollowers(handle: string, credentials?: AccountCredentials, limit?: number): Promise<FollowerInfo[]>;
    sendPost(payload: PostJobPayload, credentials: AccountCredentials): Promise<void>;
    sendDM(payload: DmJobPayload, credentials: AccountCredentials): Promise<SendDmResult>;
    getAccountCredentials(accountId: string): Promise<AccountCredentials>;
    extractStatusCode(error: unknown): number | undefined;
    extractErrorMessage(error: unknown): string;
    private createAgent;
    private login;
    private createAuthenticatedAgent;
    private initializeSharedAgent;
    private getSharedAgent;
    private normalizeCredentials;
    private resolveTarget;
    private ensureConversation;
    private handleBlueskyError;
}
