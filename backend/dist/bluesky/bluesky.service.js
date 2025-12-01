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
var BlueskyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueskyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const api_1 = require("@atproto/api");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../security/encryption.service");
const bluesky_errors_1 = require("./bluesky.errors");
let BlueskyService = BlueskyService_1 = class BlueskyService {
    constructor(prisma, encryptionService, configService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
        this.configService = configService;
        this.logger = new common_1.Logger(BlueskyService_1.name);
        this.sharedAgent = null;
        this.sharedSession = null;
        this.defaultServiceUrl =
            this.configService.get('bluesky.serviceUrl', { infer: true }) ??
                'https://bsky.social';
        this.sharedIdentifier = this.configService.get('bluesky.identifier', { infer: true });
        this.sharedAppPassword = this.configService.get('bluesky.appPassword', { infer: true });
    }
    async onModuleInit() {
        await this.initializeSharedAgent();
    }
    async followUser(handle, credentials) {
        this.logger.log(`Following user: ${handle} using ${credentials ? 'account credentials' : 'shared agent'}`);
        const agent = credentials
            ? await this.createAuthenticatedAgent(credentials)
            : await this.getSharedAgent();
        try {
            const { data: resolved } = await agent.resolveHandle({ handle });
            if (!resolved?.did) {
                throw new bluesky_errors_1.BlueskyRequestError(`Unable to resolve DID for handle ${handle}`);
            }
            const repoDid = credentials?.account?.did ?? agent.session?.did;
            if (!repoDid) {
                throw new bluesky_errors_1.BlueskyRequestError('Unable to determine repository DID for follow request');
            }
            await agent.api.app.bsky.graph.follow.create({
                repo: repoDid,
            }, {
                $type: 'app.bsky.graph.follow',
                subject: resolved.did,
                createdAt: new Date().toISOString(),
            });
            this.logger.log(`Successfully followed ${handle}`);
            return {
                success: true,
                handle,
                did: resolved.did,
                detail: 'followed',
            };
        }
        catch (error) {
            this.handleBlueskyError(`following user ${handle}`, error);
        }
    }
    async getFollowers(handle, credentials, limit = 50) {
        this.logger.log(`Getting followers for: ${handle} using ${credentials ? 'account credentials' : 'shared agent'}`);
        const agent = credentials
            ? await this.createAuthenticatedAgent(credentials)
            : await this.getSharedAgent();
        try {
            const { data: resolved } = await agent.resolveHandle({ handle });
            if (!resolved?.did) {
                throw new bluesky_errors_1.BlueskyRequestError(`Unable to resolve DID for handle ${handle}`);
            }
            const { data: followersData } = await agent.api.app.bsky.graph.getFollowers({
                actor: resolved.did,
                limit,
            });
            const followers = (followersData?.followers || []).map((follower) => ({
                handle: follower.handle,
                did: follower.did,
                displayName: follower.displayName,
                description: follower.description,
                createdAt: follower.createdAt,
            }));
            this.logger.log(`Retrieved ${followers.length} followers for ${handle}`);
            return followers;
        }
        catch (error) {
            this.handleBlueskyError(`getting followers for ${handle}`, error);
        }
    }
    async sendPost(payload, credentials) {
        this.logger.log(`Processing POST job ${payload.logId} for campaign ${payload.campaignId} with account ${credentials.handle}`);
        const agent = await this.createAuthenticatedAgent(credentials);
        try {
            await agent.post({
                text: payload.message,
                createdAt: new Date().toISOString(),
                facets: payload.richTextJson,
                langs: ['ar', 'en'],
            });
            this.logger.log('Bluesky API Success! Post created.');
        }
        catch (error) {
            this.handleBlueskyError(`posting message for campaign ${payload.campaignId}`, error);
        }
    }
    async sendDM(payload, credentials) {
        const targetLabel = payload.targetHandle || payload.targetId;
        this.logger.log(`Processing DM job ${payload.logId} for campaign ${payload.campaignId} targeting ${targetLabel}`);
        if (!targetLabel) {
            throw new bluesky_errors_1.BlueskyRequestError('Missing target handle for DM job');
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
            const messageData = messageResult?.data;
            const messageId = messageData?.message?.id ??
                messageData?.id ??
                null;
            this.logger.log(`Bluesky API Success! DM sent to ${handle}`);
            return {
                convoId,
                messageId,
                targetDid: did,
                targetHandle: handle,
            };
        }
        catch (error) {
            this.handleBlueskyError(`sending DM to ${targetLabel}`, error);
        }
    }
    async getAccountCredentials(accountId) {
        const account = await this.prisma.account.findUnique({ where: { id: accountId } });
        if (!account) {
            throw new common_1.NotFoundException(`Account not found: ${accountId}`);
        }
        return {
            account,
            handle: account.handle,
            password: this.encryptionService.decrypt(account.encryptedAppPassword),
        };
    }
    extractStatusCode(error) {
        const anyError = error;
        return anyError?.status ?? anyError?.response?.status;
    }
    extractErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return 'Unknown Bluesky API error';
    }
    createAgent() {
        return new api_1.AtpAgent({ service: this.defaultServiceUrl });
    }
    async login(agent, credentials) {
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
        }
        catch (error) {
            this.handleBlueskyError(`logging in as ${normalized.identifier}`, error);
        }
    }
    async createAuthenticatedAgent(credentials) {
        const agent = this.createAgent();
        await this.login(agent, credentials);
        return agent;
    }
    async initializeSharedAgent() {
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
        }
        catch (error) {
            this.sharedAgent = null;
            this.sharedSession = null;
            this.logger.error(`Failed to initialize shared Bluesky agent: ${this.extractErrorMessage(error)}`);
        }
    }
    async getSharedAgent() {
        if (!this.sharedIdentifier || !this.sharedAppPassword) {
            throw new bluesky_errors_1.BlueskyRequestError('Bluesky identifier or app password is not configured. Set BLUESKY_IDENTIFIER and BLUESKY_APP_PASSWORD.');
        }
        if (!this.sharedAgent) {
            this.sharedAgent = this.createAgent();
        }
        if (this.sharedSession) {
            try {
                await this.sharedAgent.resumeSession(this.sharedSession);
                return this.sharedAgent;
            }
            catch (error) {
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
    normalizeCredentials(credentials) {
        if ('identifier' in credentials) {
            return credentials;
        }
        return {
            identifier: credentials.handle,
            password: credentials.password,
            account: credentials.account,
        };
    }
    async resolveTarget(agent, payload) {
        if (payload.targetDid && payload.targetHandle) {
            return { did: payload.targetDid, handle: payload.targetHandle };
        }
        const handle = payload.targetHandle || payload.targetId;
        if (!handle) {
            throw new bluesky_errors_1.BlueskyRequestError('Target handle is required for DM');
        }
        try {
            const { data } = await agent.resolveHandle({ handle });
            if (!data?.did) {
                throw new bluesky_errors_1.BlueskyRequestError(`Unable to resolve DID for handle ${handle}`);
            }
            return { did: data.did, handle: handle };
        }
        catch (error) {
            this.handleBlueskyError(`resolving handle ${handle}`, error);
        }
    }
    async ensureConversation(agent, did) {
        try {
            const response = await agent.api.chat.bsky.convo.getConvoForMembers({ members: [did] });
            const convoId = response?.data?.convo?.id;
            if (convoId) {
                return convoId;
            }
            throw new bluesky_errors_1.BlueskyRequestError('Bluesky did not return a conversation ID. Confirm the target allows DMs or that a conversation already exists.');
        }
        catch (error) {
            const message = this.extractErrorMessage(error);
            if (message.includes('Lexicon not found')) {
                throw new bluesky_errors_1.BlueskyRequestError('Bluesky chat API is unavailable for this service. Ensure chat access is enabled and your SDK is up to date.');
            }
            this.handleBlueskyError(`fetching DM conversation for DID ${did}`, error);
        }
    }
    handleBlueskyError(context, error) {
        const message = this.extractErrorMessage(error);
        const status = this.extractStatusCode(error);
        this.logger.error(`Bluesky API Error while ${context}: ${message}`);
        throw new bluesky_errors_1.BlueskyRequestError(message, status);
    }
};
exports.BlueskyService = BlueskyService;
exports.BlueskyService = BlueskyService = BlueskyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService,
        config_1.ConfigService])
], BlueskyService);
//# sourceMappingURL=bluesky.service.js.map