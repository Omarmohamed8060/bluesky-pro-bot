import { Controller, Get, Post, Delete, Param, Body, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { QueueService } from '../queue/queue.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
  ) {}

  @Post()
  async create(@Body() createCampaignDto: CreateCampaignDto) {
    try {
      console.log('CAMPAIGN CREATE - Received DTO:', createCampaignDto);
      
      // Strip any temp IDs coming from the frontend so Prisma can generate the real ID
      const { id, campaignId, ...cleanDto } = createCampaignDto as any;

      const campaign = await this.campaignsService.create(cleanDto);
      let jobId: string | null = null;

      try {
        jobId = await this.queueService.addJob({
          campaignId: campaign.id,
          accountId: cleanDto.accountId,
          type: cleanDto.type,
          message: cleanDto.message,
          targets: cleanDto.targets,
          templateId: campaign.template?.id,
        });
      } catch (queueError) {
        console.error('CAMPAIGN CREATE - Failed to enqueue campaign:', queueError);
      }

      console.log('CAMPAIGN CREATE - Created campaign:', campaign);
      
      // Parse targets to get count
      let totalTargets = 0;
      try {
        const targets = campaign.targetsJson ? JSON.parse(campaign.targetsJson) : [];
        totalTargets = targets.length;
      } catch (e) {
        console.error('Failed to parse targets:', e);
      }
      
      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type.toLowerCase(),
        status: campaign.status.toLowerCase(),
        message: campaign.template?.body || '',
        targetList: [], // Will be populated from target list
        createdAt: campaign.createdAt.toISOString(),
        startedAt: campaign.startedAt?.toISOString() || null,
        completedAt: campaign.completedAt?.toISOString() || null,
        totalTargets,
        sentCount: campaign.sentCount || 0,
        successCount: campaign.successCount || 0,
        failureCount: 0,
        successRate: 0,
        jobId,
      };
    } catch (error: unknown) {
      console.error('CAMPAIGN CREATE ERROR:', error);
      console.error('CAMPAIGN CREATE ERROR DETAILS:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack available',
        dto: createCampaignDto
      });
      
      // Return detailed error to frontend
      throw new HttpException(
        {
          error: 'Failed to create campaign',
          details: error instanceof Error ? error.message : 'Unknown error',
          receivedData: createCampaignDto
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async findAll() {
    const campaigns = await this.campaignsService.findAll();
    return campaigns.map((campaign: any) => {
      // Parse targets to get count
      let totalTargets = 0;
      try {
        const targets = campaign.targetsJson ? JSON.parse(campaign.targetsJson) : [];
        totalTargets = targets.length;
      } catch (e) {
        // Ignore parse errors
      }
      
      const sentCount = campaign.sentCount || 0;
      const successCount = campaign.successCount || 0;
      const successRate = sentCount > 0 ? (successCount / sentCount) * 100 : 0;
      
      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type.toLowerCase(),
        status: campaign.status.toLowerCase(),
        message: campaign.template?.body || '',
        targetList: [],
        createdAt: campaign.createdAt.toISOString(),
        startedAt: campaign.startedAt?.toISOString() || null,
        completedAt: campaign.completedAt?.toISOString() || null,
        totalTargets,
        sentCount,
        successCount,
        failureCount: sentCount - successCount,
        successRate,
      };
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.campaignsService.remove(id);
      return { message: 'Campaign deleted successfully' };
    } catch (error) {
      throw new HttpException('Failed to delete campaign', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
