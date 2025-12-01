import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlueskyService } from '../bluesky/bluesky.service';
import { RateLimitService } from '../safety/rate-limit.service';
import { TemplatesService } from '../templates/templates.service';
import { DmJobPayload, PostJobPayload } from './job.types';
import { SettingsService } from '../settings/settings.service';

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  nextAvailable?: Date;
}

@Injectable()
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blueskyService: BlueskyService,
    private readonly rateLimitService: RateLimitService,
    private readonly templatesService: TemplatesService,
    private readonly settingsService: SettingsService,
  ) {}

  async processJob(jobData: any) {
    console.log('🚀 [QUEUE PROCESSOR] Starting job processing:', {
      campaignId: jobData.campaignId,
      type: jobData.type,
      accountId: jobData.accountId,
      targetsCount: jobData.targets?.length || 0
    });

    const { type, accountId, targets, message, campaignId, templateId } = jobData;
    
    // Validate required fields
    if (!campaignId) {
      throw new Error('campaignId is required for job processing');
    }
    
    if (!type || !accountId) {
      throw new Error('type and accountId are required for job processing');
    }

    // Validate campaign exists before processing
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        account: true,
        template: true,
        targetList: true
      }
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    this.logger.log(`Starting campaign processing: ${campaignId} (${type})`);
    
    try {
      // Get account details
      const credentials = await this.blueskyService.getAccountCredentials(accountId);
      const account = credentials.account;

      this.logger.log(`Processing with account: ${account.handle}`);

      // Check rate limit for this account
      const actionType = (campaign.type as 'DM' | 'POST') ?? 'DM';
      const rateLimitResult = await this.rateLimitService.checkRateLimit(accountId, actionType) as RateLimitResult;
      if (!rateLimitResult.allowed) {
        this.logger.warn(`Rate limit exceeded for account ${account.handle}. Next available: ${rateLimitResult.nextAvailable}`);
        
        // Log rate limit
        await this.prisma.logEntry.create({
          data: {
            level: 'WARN',
            accountId,
            campaignId,
            message: `Rate limit exceeded for account ${account.handle}`,
            metadata: { nextAvailable: rateLimitResult.nextAvailable } as any
          }
        });
        
        return {
          success: false,
          error: 'Rate limit exceeded',
          nextAvailable: rateLimitResult.nextAvailable
        };
      }

      // Get targets from campaign if not provided
      let parsedTargets = targets;
      if (!parsedTargets && campaign.targetsJson) {
        parsedTargets = JSON.parse(campaign.targetsJson || '[]');
      } else if (!parsedTargets && campaign.targetListId) {
        const targetList = await this.prisma.targetList.findUnique({
          where: { id: campaign.targetListId }
        });
        
        if (targetList && targetList.targetsJson) {
          parsedTargets = JSON.parse(targetList.targetsJson || '[]');
        }
      }

      if (!parsedTargets || parsedTargets.length === 0) {
        throw new Error('No targets found for campaign');
      }

      // Update campaign status to RUNNING
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { 
          status: 'RUNNING' as any,
          startedAt: new Date()
        }
      });

      // Log campaign start
      await this.prisma.logEntry.create({
        data: {
          level: 'INFO',
          message: `Starting ${type} campaign for ${parsedTargets.length} targets using account ${account.handle}`,
          accountId,
          campaignId,
          metadata: {
            campaignType: type,
            targetCount: parsedTargets.length
          } as any
        }
      });

      this.logger.log(`Processing ${parsedTargets.length} targets`);

      const coreSettings = await this.settingsService.getCoreSettings();
      const delayMs = Math.max(0, Math.round(coreSettings.delayBetweenActions * 1000));

      // Process each target
      const results = [];
      for (const target of parsedTargets) {
        const result = await this.processTarget(
          campaign,
          account,
          target,
          message,
          templateId,
          credentials,
        );
        results.push(result);
        
        // Add delay between messages to respect automation settings
        if (delayMs > 0) {
          await this.delay(delayMs);
        }
      }

      // Mark campaign as completed
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { 
          status: 'COMPLETED' as any,
          completedAt: new Date()
        }
      });

      console.log('✅ [QUEUE PROCESSOR] Campaign completed:', {
        campaignId,
        totalTargets: parsedTargets.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      });
      
      this.logger.log(`Campaign ${campaignId} completed successfully`);
      
      return {
        success: true,
        results,
        totalProcessed: results.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      };

    } catch (error: any) {
      this.logger.error(`Campaign processing failed: ${error.message}`, error.stack);
      
      // Update campaign status to failed
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'FAILED' as any,
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  private async processTarget(
    campaign: any,
    account: any,
    target: any,
    message: string,
    templateId: string | undefined,
    credentials: Awaited<ReturnType<BlueskyService['getAccountCredentials']>>,
  ) {
    const targetId = typeof target === 'string' ? target : target.id || target.handle;
    
    try {
      // Get target details
      let targetData;
      if (typeof target === 'string') {
        targetData = { handle: target };
      } else {
        targetData = target;
      }

      // Log processing start
      this.logger.log(`Processing target: ${targetData.handle}`);


      // Render template if templateId is provided
      let finalMessage = message;
      if (templateId) {
        const variables = {
          username: targetData.handle || targetData.displayName || 'there',
          displayName: targetData.displayName || targetData.handle || 'there',
          handle: targetData.handle || '',
        };
        finalMessage = await this.templatesService.renderTemplate(templateId, variables);
      }

      if (campaign.type === 'POST' && targetData.handle) {
        const mentionHandle = `@${targetData.handle.replace(/^@/, '')}`;
        if (!finalMessage.includes(mentionHandle)) {
          finalMessage = `${mentionHandle} ${finalMessage}`.trim();
        }
      }

      // Send message based on campaign type
      let result: unknown;
      if (campaign.type === 'DM') {
        const dmPayload: DmJobPayload = {
          accountId: account.id,
          campaignId: campaign.id,
          campaignTargetId: `temp-${Date.now()}`,
          targetId: targetId,
          targetHandle: targetData.handle,
          templateId: templateId || 'default',
          logId: `log-${Date.now()}`,
          message: finalMessage,
          renderContext: {
            username: targetData.handle || targetData.displayName || 'there',
            displayName: targetData.displayName || targetData.handle || 'there',
            handle: targetData.handle || '',
          }
        };
        result = await this.blueskyService.sendDM(dmPayload, credentials);
      } else if (campaign.type === 'POST') {
        const postPayload: PostJobPayload = {
          accountId: account.id,
          campaignId: campaign.id,
          campaignTargetId: `temp-${Date.now()}`,
          targetId: targetId,
          targetHandle: targetData.handle,
          templateId: templateId || 'default',
          logId: `log-${Date.now()}`,
          message: finalMessage,
          renderContext: {
            username: targetData.handle || targetData.displayName || 'there',
            displayName: targetData.displayName || targetData.handle || 'there',
            handle: targetData.handle || '',
          }
        };
        result = await this.blueskyService.sendPost(postPayload, credentials);
      }

      // Target processed successfully

      // Increment campaign sentCount and successCount
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          sentCount: { increment: 1 },
          successCount: { increment: 1 },
        },
      });

      // Log success
      const metadata: Record<string, any> = {
        campaignType: campaign.type,
        targetHandle: targetData.handle,
      };

      if (campaign.type === 'POST' && result && typeof result === 'object') {
        const postResult = result as { id?: string; uri?: string; cid?: string };
        if (postResult.id) {
          metadata.messageId = postResult.id;
        }
        if (postResult.uri) {
          metadata.messageUri = postResult.uri;
        }
        if (postResult.cid) {
          metadata.messageCid = postResult.cid;
        }
      }

      if (campaign.type === 'DM' && result && typeof result === 'object') {
        const dmResult = result as { messageId?: string | null; convoId?: string; targetDid?: string; targetHandle?: string };
        if (dmResult.messageId) {
          metadata.messageId = dmResult.messageId;
        }
        if (dmResult.convoId) {
          metadata.conversationId = dmResult.convoId;
        }
        if (dmResult.targetDid) {
          metadata.targetDid = dmResult.targetDid;
        }
        if (dmResult.targetHandle && !metadata.targetHandle) {
          metadata.targetHandle = dmResult.targetHandle;
        }
      }

      await this.prisma.logEntry.create({
        data: {
          level: 'INFO',
          accountId: account.id,
          campaignId: campaign.id,
          message: `Successfully sent ${campaign.type.toLowerCase()} to ${targetData.handle}`,
          metadata: metadata as any,
        },
      });

      console.log('✅ [QUEUE PROCESSOR] Target processed successfully:', {
        campaignId: campaign.id,
        targetHandle: targetData.handle,
        sentCount: campaign.sentCount + 1
      });
      
      this.logger.log(`Successfully sent ${campaign.type.toLowerCase()} to ${targetData.handle}`);

      return {
        success: true,
        target: targetData,
        messageId: (result as any)?.id
      };

    } catch (error: any) {
      // Target processing failed

      // Increment campaign sentCount only (failure)
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          sentCount: { increment: 1 },
        },
      });

      // Get target data for error logging
      let targetData;
      if (typeof target === 'string') {
        targetData = { handle: target };
      } else {
        targetData = target;
      }

      // Log error
      await this.prisma.logEntry.create({
        data: {
          level: 'ERROR',
          accountId: account.id,
          campaignId: campaign.id,
          message: `Failed to send ${campaign.type.toLowerCase()} to ${targetData.handle}: ${error.message}`,
          metadata: {
            campaignType: campaign.type,
            targetHandle: targetData.handle,
            error: error.message
          } as any
        }
      });

      console.error('💥 [QUEUE PROCESSOR] Target processing failed:', {
        campaignId: campaign.id,
        targetHandle: targetData.handle,
        error: error.message,
        stack: error.stack
      });
      
      this.logger.error(`Failed to send ${campaign.type.toLowerCase()} to ${targetData.handle}: ${error.message}`);

      return {
        success: false,
        target: targetData,
        error: error.message
      };
    }
  }


  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
