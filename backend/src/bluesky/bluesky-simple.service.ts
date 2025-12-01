import { Injectable, Logger } from '@nestjs/common';
import { AtpAgent } from '@atproto/api';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlueskyService {
  private readonly logger = new Logger(BlueskyService.name);
  private readonly serviceUrl = 'https://bsky.social';

  constructor(private readonly prisma: PrismaService) {}

  async sendPost(accountId: string, text: string): Promise<{ uri: string; cid: string }> {
    try {
      const agent = new AtpAgent({ service: this.serviceUrl });
      
      this.logger.log(`Sending post for account: ${accountId}`);
      
      // Get account credentials from database
      const account = await this.getAccountCredentials(accountId);
      if (!account) {
        throw new Error(`Account not found: ${accountId}`);
      }

      // Login with real credentials
      await agent.login({ 
        identifier: account.handle, 
        password: account.encryptedAppPassword 
      });
      
      this.logger.log(`Successfully logged in as ${account.handle}`);

      // Send real post
      const post = await agent.post({
        text: text
      });
      
      this.logger.log(`Post published successfully: ${post.uri}`);
      
      // Update account last login
      await this.updateAccountLastLogin(accountId);
      
      return { uri: post.uri, cid: post.cid };
      
    } catch (error: any) {
      this.logger.error('Failed to send post:', error);
      throw new Error(`Failed to send post: ${error.message}`);
    }
  }

  async sendDM(accountId: string, targetHandle: string, message: string): Promise<void> {
    try {
      const agent = new AtpAgent({ service: this.serviceUrl });
      
      this.logger.log(`Sending DM to ${targetHandle} for account: ${accountId}`);
      
      // Get account credentials from database
      const account = await this.getAccountCredentials(accountId);
      if (!account) {
        throw new Error(`Account not found: ${accountId}`);
      }

      // Login with real credentials
      await agent.login({ 
        identifier: account.handle, 
        password: account.encryptedAppPassword 
      });
      
      this.logger.log(`Successfully logged in as ${account.handle}`);

      // Resolve target handle to DID
      const resolveResult = await agent.resolveHandle({ handle: targetHandle });
      const targetDid = resolveResult.data.did;
      
      this.logger.log(`Resolved target ${targetHandle} to DID: ${targetDid}`);

      // Send DM using the chat API
      const convo = await agent.api.chat.bsky.convo.getConvoForMembers({
        members: [targetDid]
      });

      // Send message
      const messageResult = await agent.api.chat.bsky.convo.sendMessage({
        convoId: convo.data.convo.id,
        message: {
          $type: 'chat.bsky.convo.defs#messageInput',
          text: message,
        }
      });

      this.logger.log(`DM sent successfully to ${targetHandle}, message ID: ${messageResult.data.id}`);
      
      // Update account last login
      await this.updateAccountLastLogin(accountId);
      
    } catch (error: any) {
      this.logger.error('Failed to send DM:', error);
      
      // Provide specific error messages
      if (error.message?.includes('InvalidAuth')) {
        throw new Error('Invalid credentials for account. Please check app password.');
      } else if (error.message?.includes('NotFound')) {
        throw new Error(`Target user ${targetHandle} not found on Bluesky.`);
      } else if (error.message?.includes('RateLimit')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Failed to send DM: ${error.message}`);
      }
    }
  }

  private async getAccountCredentials(accountId: string) {
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

    // In production, decrypt the password here
    // For now, return as-is since it's stored as plain text
    return account;
  }

  private async updateAccountLastLogin(accountId: string) {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { lastLoginAt: new Date() }
    });
  }

  async testAccountConnection(accountId: string): Promise<boolean> {
    try {
      const agent = new AtpAgent({ service: this.serviceUrl });
      
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
      
    } catch (error) {
      this.logger.error(`Account connection test failed for ${accountId}:`, error);
      return false;
    }
  }
}
