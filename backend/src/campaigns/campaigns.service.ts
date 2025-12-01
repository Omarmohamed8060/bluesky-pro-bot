import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCampaignDto: CreateCampaignDto) {
    const { name, type, message, targets, accountId } = createCampaignDto;
    
    this.logger.log(`Creating campaign: ${name} (${type}) with ${targets?.length || 0} targets`);
    
    // Validate input
    if (!name || !type || !message || !targets || !accountId) {
      throw new Error('Missing required fields for campaign creation');
    }
    
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new Error('Targets must be a non-empty array');
    }
    
    // Filter out empty targets and validate format
    const validTargets = targets.filter(target => {
      const trimmed = target?.trim();
      return trimmed && (trimmed.endsWith('.bsky.social') || trimmed.startsWith('did:'));
    });
    
    if (validTargets.length === 0) {
      throw new Error('Targets must contain at least one valid Bluesky handle or DID');
    }
    
    // Validate account exists
    const account = await this.prisma.account.findUnique({
      where: { id: accountId }
    });
    
    if (!account) {
      throw new Error(`Account not found with ID: ${accountId}`);
    }
    
    try {
      // Create template for the campaign
      const template = await this.prisma.template.create({
        data: {
          name: `${name} Template`,
          type: type === 'dm' ? 'DM' : 'POST',
          body: message, // Store message with placeholders
        },
      });
      
      // Create the campaign with serialized targets
      const campaign = await this.prisma.campaign.create({
        data: {
          name,
          accountId,
          templateId: template.id,
          targetsJson: JSON.stringify(validTargets),
          type: type === 'dm' ? 'DM' : 'POST',
          status: 'QUEUED',
          maxPerHour: 20, // Default rate limits
          maxPerDay: 200,
        },
        include: {
          template: true,
          account: true,
        },
      });
      
      this.logger.log(`Campaign created successfully: ${campaign.id}`);
      return campaign;
      
    } catch (error: any) {
      this.logger.error('Failed to create campaign:', error);
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  async findAll() {
    return this.prisma.campaign.findMany({
      include: {
        template: true,
        account: true,
        _count: {
          select: {
            logs: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        account: true,
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        }
      }
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${id}`);
    }

    // Parse targets if they exist
    let parsedTargets = [];
    if (campaign.targetsJson) {
      try {
        parsedTargets = JSON.parse(campaign.targetsJson);
      } catch (error) {
        this.logger.warn(`Failed to parse targets for campaign ${id}`);
      }
    }

    return {
      ...campaign,
      targets: parsedTargets,
    };
  }

  async updateStatus(id: string, status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'COOLDOWN') {
    const updateData: any = { status };
    
    if (status === 'RUNNING') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED' || status === 'COOLDOWN') {
      updateData.completedAt = new Date();
    }

    return this.prisma.campaign.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.campaign.delete({
      where: { id },
    });
  }

  // Template variable replacement
  processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    
    // Replace common placeholders
    const replacements: Record<string, string> = {
      '{{username}}': variables.username || variables.handle || '',
      '{{name}}': variables.displayName || variables.name || '',
      '{{link}}': variables.link || '',
      '{{custom}}': variables.custom || '',
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      processed = processed.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return processed;
  }

  // Get campaign statistics
  async getStats(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        logs: true,
        _count: {
          select: {
            logs: true,
          }
        }
      }
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${id}`);
    }

    const totalLogs = campaign._count.logs;
    const successLogs = campaign.logs.filter(log => log.level === 'INFO').length;
    const failureLogs = campaign.logs.filter(log => log.level === 'ERROR').length;
    
    const targets = campaign.targetsJson ? JSON.parse(campaign.targetsJson) : [];
    
    return {
      totalTargets: targets.length,
      totalLogs,
      successCount: successLogs,
      failureCount: failureLogs,
      successRate: totalLogs > 0 ? (successLogs / totalLogs) * 100 : 0,
      status: campaign.status,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
    };
  }
}
