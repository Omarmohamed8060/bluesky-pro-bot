import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AtpAgent } from '@atproto/api';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../security/encryption.service';
import { DmJobPayload, PostJobPayload } from '../queue/job.types';
import { BlueskyRequestError } from './bluesky.errors';

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

interface BasicCredentials {
  identifier: string;
  password: string;
  account?: Account;
}

@Injectable()
export class BlueskyService implements OnModuleInit {
  private readonly logger = new Logger(BlueskyService.name);
  private readonly defaultServiceUrl: string;
  private readonly sharedIdentifier?: string;
  private readonly sharedAppPassword?: string;
  private sharedAgent: AtpAgent | null = null;
  private sharedSession: AtpAgent['session'] | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
  ) {
    this.defaultServiceUrl =
      this.configService.get<string>('bluesky.serviceUrl', { infer: true }) ??
      'https://bsky.social';
    this.sharedIdentifier = this.configService.get<string>('bluesky.identifier', { infer: true });
    this.sharedAppPassword = this.configService.get<string>('bluesky.appPassword', { infer: true });
  }

  async onModuleInit(): Promise<void> {
    await this.initializeSharedAgent();
  }

  async followUser(handle: string, credentials?: AccountCredentials): Promise<FollowResult> {
    this.logger.log(`Following user: ${handle} using ${credentials ? 'account credentials' : 'shared agent'}`);

    const agent = credentials
      ? await this.createAuthenticatedAgent(credentials)
      : await this.getSharedAgent();

    try {
      const { data: resolved } = await agent.resolveHandle({ handle });
      if (!resolved?.did) {
        throw new BlueskyRequestError(`Unable to resolve DID for handle ${handle}`);
      }

      const repoDid = credentials?.account?.did ?? agent.session?.did;
      if (!repoDid) {
        throw new BlueskyRequestError('Unable to determine repository DID for follow request');
      }

      await agent.api.app.bsky.graph.follow.create(
        {
          repo: repoDid,
        },
        {
          $type: 'app.bsky.graph.follow',
          subject: resolved.did,
          createdAt: new Date().toISOString(),
        } as any,
      );

      this.logger.log(`Successfully followed ${handle}`);
      return {
        success: true,
        handle,
        did: resolved.did,
        detail: 'followed',
      };
    } catch (error) {
      this.handleBlueskyError(`following user ${handle}`, error);
    }
  }

  async getFollowers(handle: string, credentials?: AccountCredentials, limit: number = 50): Promise<FollowerInfo[]> {
    this.logger.log(`Getting followers for: ${handle} using ${credentials ? 'account credentials' : 'shared agent'}`);

    const agent = credentials
      ? await this.createAuthenticatedAgent(credentials)
      : await this.getSharedAgent();

    try {
      const { data: resolved } = await agent.resolveHandle({ handle });
      if (!resolved?.did) {
        throw new BlueskyRequestError(`Unable to resolve DID for handle ${handle}`);
      }

      const { data: followersData } = await agent.api.app.bsky.graph.getFollowers({
        actor: resolved.did,
        limit,
      });

      const followers: FollowerInfo[] = (followersData?.followers || []).map((follower: any) => ({
        handle: follower.handle,
        did: follower.did,
        displayName: follower.displayName,
        description: follower.description,
        createdAt: follower.createdAt,
      }));

      this.logger.log(`Retrieved ${followers.length} followers for ${handle}`);
      return followers;
    } catch (error) {
      this.handleBlueskyError(`getting followers for ${handle}`, error);
    }
  }

  async sendPost(payload: PostJobPayload, credentials: AccountCredentials): Promise<void> {
    this.logger.log(
      `Processing POST job ${payload.logId} for campaign ${payload.campaignId} with account ${credentials.handle}`,
    );

    const agent = await this.createAuthenticatedAgent(credentials);

    try {
      await agent.post({
        text: payload.message,
        createdAt: new Date().toISOString(),
        facets: payload.richTextJson as any,
        langs: ['ar', 'en'],
      });

      this.logger.log('Bluesky API Success! Post created.');
    } catch (error) {
      this.handleBlueskyError(
        `posting message for campaign ${payload.campaignId}`,
        error,
      );
    }
  }

  async sendDM(payload: DmJobPayload, credentials: AccountCredentials): Promise<SendDmResult> {
    const targetLabel = payload.targetHandle || payload.targetId;
    this.logger.log(
      `Processing DM job ${payload.logId} for campaign ${payload.campaignId} targeting ${targetLabel}`,
    );

    if (!targetLabel) {
      throw new BlueskyRequestError('Missing target handle for DM job');
    }

    const agent = await this.createAuthenticatedAgent(credentials);

    try {
      const { did, handle } = await this.resolveTarget(agent, payload);

      const convoId = await this.ensureConversation(agent, did);

      const messageResult = await agent.api.chat.bsky.convo.sendMessage({
        convoId,
        message: {
          $type: 'chat.bsky.convo.defs#messageInput',
          text: payload.message,
        },
      });

      const messageData = (messageResult as any)?.data;
      const messageId =
        messageData?.message?.id ??
        messageData?.id ??
        null;

      this.logger.log(`Bluesky API Success! DM sent to ${handle}`);

      return {
        convoId,
        messageId,
        targetDid: did,
        targetHandle: handle,
      };
    } catch (error) {
      this.handleBlueskyError(
        `sending DM to ${targetLabel}`,
        error,
      );
    }
  }

  async getAccountCredentials(accountId: string): Promise<AccountCredentials> {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });

    if (!account) {
      throw new NotFoundException(`Account not found: ${accountId}`);
    }

    return {
      account,
      handle: account.handle,
      password: this.encryptionService.decrypt(account.encryptedAppPassword),
    };
  }

  extractStatusCode(error: unknown): number | undefined {
    const anyError = error as { status?: number; response?: { status?: number } };
    return anyError?.status ?? anyError?.response?.status;
  }

  extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown Bluesky API error';
  }

  private createAgent(): AtpAgent {
    return new AtpAgent({ service: this.defaultServiceUrl });
  }

  private async login(agent: AtpAgent, credentials: AccountCredentials | BasicCredentials): Promise<void> {
    const normalized = this.normalizeCredentials(credentials);
    this.logger.log(`Logging in as ${normalized.identifier}...`);
    try {
      await agent.login({ identifier: normalized.identifier, password: normalized.password });
      this.logger.log(`Logged in as ${normalized.identifier}`);

      const sessionDid = agent.session?.did;
      if (sessionDid && normalized.account && normalized.account.did !== sessionDid) {
        await this.prisma.account.update({
          where: { id: normalized.account.id },
          data: { did: sessionDid },
        });
        normalized.account.did = sessionDid;
        this.logger.log(`Updated account DID for ${normalized.identifier} -> ${sessionDid}`);
      }
    } catch (error) {
      this.handleBlueskyError(`logging in as ${normalized.identifier}`, error);
    }
  }

  private async createAuthenticatedAgent(credentials: AccountCredentials): Promise<AtpAgent> {
    const agent = this.createAgent();
    await this.login(agent, credentials);
    return agent;
  }

  private async initializeSharedAgent(): Promise<void> {
    if (!this.sharedIdentifier || !this.sharedAppPassword) {
      this.logger.warn('Shared Bluesky credentials are not configured; using account-based logins only.');
      return;
    }

    try {
      this.sharedAgent = this.createAgent();
      await this.login(this.sharedAgent, {
        identifier: this.sharedIdentifier,
        password: this.sharedAppPassword,
      });
      this.sharedSession = this.sharedAgent.session ?? null;
      this.logger.log('Shared Bluesky agent initialized successfully.');
    } catch (error) {
      this.sharedAgent = null;
      this.sharedSession = null;
      this.logger.error(`Failed to initialize shared Bluesky agent: ${this.extractErrorMessage(error)}`);
    }
  }

  private async getSharedAgent(): Promise<AtpAgent> {
    if (!this.sharedIdentifier || !this.sharedAppPassword) {
      throw new BlueskyRequestError(
        'Bluesky identifier or app password is not configured. Set BLUESKY_IDENTIFIER and BLUESKY_APP_PASSWORD.',
      );
    }

    if (!this.sharedAgent) {
      this.sharedAgent = this.createAgent();
    }

    if (this.sharedSession) {
      try {
        await this.sharedAgent.resumeSession(this.sharedSession);
        return this.sharedAgent;
      } catch (error) {
        this.logger.warn('Failed to resume Bluesky session; re-authenticating.');
        this.sharedSession = null;
      }
    }

    await this.login(this.sharedAgent, {
      identifier: this.sharedIdentifier,
      password: this.sharedAppPassword,
    });
    this.sharedSession = this.sharedAgent.session ?? null;
    return this.sharedAgent;
  }

  private normalizeCredentials(credentials: AccountCredentials | BasicCredentials): BasicCredentials {
    if ('identifier' in credentials) {
      return credentials;
    }

    return {
      identifier: credentials.handle,
      password: credentials.password,
      account: credentials.account,
    };
  }

  private async resolveTarget(agent: AtpAgent, payload: DmJobPayload): Promise<{ did: string; handle: string }> {
    if (payload.targetDid && payload.targetHandle) {
      return { did: payload.targetDid, handle: payload.targetHandle };
    }

    const handle = payload.targetHandle || payload.targetId;
    if (!handle) {
      throw new BlueskyRequestError('Target handle is required for DM');
    }

    try {
      const { data } = await agent.resolveHandle({ handle });
      if (!data?.did) {
        throw new BlueskyRequestError(`Unable to resolve DID for handle ${handle}`);
      }
      return { did: data.did, handle: handle }; 
    } catch (error) {
      this.handleBlueskyError(`resolving handle ${handle}`, error);
    }
  }

  private async ensureConversation(agent: AtpAgent, did: string): Promise<string> {
    try {
      const response = await agent.api.chat.bsky.convo.getConvoForMembers({ members: [did] });
      const convoId = response?.data?.convo?.id;
      if (convoId) {
        return convoId;
      }

      throw new BlueskyRequestError(
        'Bluesky did not return a conversation ID. Confirm the target allows DMs or that a conversation already exists.',
      );
    } catch (error) {
      const message = this.extractErrorMessage(error);
      if (message.includes('Lexicon not found')) {
        throw new BlueskyRequestError(
          'Bluesky chat API is unavailable for this service. Ensure chat access is enabled and your SDK is up to date.',
        );
      }

      this.handleBlueskyError(`fetching DM conversation for DID ${did}`, error);
    }
  }

  private handleBlueskyError(context: string, error: unknown): never {
    const message = this.extractErrorMessage(error);
    const status = this.extractStatusCode(error);
    this.logger.error(`Bluesky API Error while ${context}: ${message}`);
    throw new BlueskyRequestError(message, status);
  }
}