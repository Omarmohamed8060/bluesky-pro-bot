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
const api_1 = require("@atproto/api");
const prisma_service_1 = require("../prisma/prisma.service");
let BlueskyService = BlueskyService_1 = class BlueskyService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(BlueskyService_1.name);
        this.serviceUrl = 'https://bsky.social';
    }
    async sendPost(accountId, text) {
        try {
            const agent = new api_1.AtpAgent({ service: this.serviceUrl });
            this.logger.log(`Sending post for account: ${accountId}`);
            const account = await this.getAccountCredentials(accountId);
            if (!account) {
                throw new Error(`Account not found: ${accountId}`);
            }
            await agent.login({
                identifier: account.handle,
                password: account.encryptedAppPassword
            });
            this.logger.log(`Successfully logged in as ${account.handle}`);
            const post = await agent.post({
                text: text
            });
            this.logger.log(`Post published successfully: ${post.uri}`);
            await this.updateAccountLastLogin(accountId);
            return { uri: post.uri, cid: post.cid };
        }
        catch (error) {
            this.logger.error('Failed to send post:', error);
            throw new Error(`Failed to send post: ${error.message}`);
        }
    }
    async sendDM(accountId, targetHandle, message) {
        try {
            const agent = new api_1.AtpAgent({ service: this.serviceUrl });
            this.logger.log(`Sending DM to ${targetHandle} for account: ${accountId}`);
            const account = await this.getAccountCredentials(accountId);
            if (!account) {
                throw new Error(`Account not found: ${accountId}`);
            }
            await agent.login({
                identifier: account.handle,
                password: account.encryptedAppPassword
            });
            this.logger.log(`Successfully logged in as ${account.handle}`);
            const resolveResult = await agent.resolveHandle({ handle: targetHandle });
            const targetDid = resolveResult.data.did;
            this.logger.log(`Resolved target ${targetHandle} to DID: ${targetDid}`);
            const convo = await agent.api.chat.bsky.convo.getConvoForMembers({
                members: [targetDid]
            });
            const messageResult = await agent.api.chat.bsky.convo.sendMessage({
                convoId: convo.data.convo.id,
                message: {
                    $type: 'chat.bsky.convo.defs#messageInput',
                    text: message,
                }
            });
            this.logger.log(`DM sent successfully to ${targetHandle}, message ID: ${messageResult.data.id}`);
            await this.updateAccountLastLogin(accountId);
        }
        catch (error) {
            this.logger.error('Failed to send DM:', error);
            if (error.message?.includes('InvalidAuth')) {
                throw new Error('Invalid credentials for account. Please check app password.');
            }
            else if (error.message?.includes('NotFound')) {
                throw new Error(`Target user ${targetHandle} not found on Bluesky.`);
            }
            else if (error.message?.includes('RateLimit')) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            else {
                throw new Error(`Failed to send DM: ${error.message}`);
            }
        }
    }
    async getAccountCredentials(accountId) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
            select: {
                id: true,
                handle: true,
                encryptedAppPassword: true,
                did: true,
                displayName: true
            }
        });
        if (!account) {
            return null;
        }
        return account;
    }
    async updateAccountLastLogin(accountId) {
        await this.prisma.account.update({
            where: { id: accountId },
            data: { lastLoginAt: new Date() }
        });
    }
    async testAccountConnection(accountId) {
        try {
            const agent = new api_1.AtpAgent({ service: this.serviceUrl });
            const account = await this.getAccountCredentials(accountId);
            if (!account) {
                return false;
            }
            await agent.login({
                identifier: account.handle,
                password: account.encryptedAppPassword
            });
            this.logger.log(`Account connection test successful for ${account.handle}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Account connection test failed for ${accountId}:`, error);
            return false;
        }
    }
};
exports.BlueskyService = BlueskyService;
exports.BlueskyService = BlueskyService = BlueskyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BlueskyService);
//# sourceMappingURL=bluesky-simple.service.js.map