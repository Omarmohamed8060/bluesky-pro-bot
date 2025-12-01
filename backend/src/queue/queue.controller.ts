import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { QueueProcessor } from './queue-processor.service';
import { StartCampaignDto } from './dto/start-campaign.dto';
import { CampaignsService } from '../campaigns/campaigns.service';

@Controller('queue')
export class QueueController {
  constructor(
    private readonly queueProcessor: QueueProcessor,
    private readonly campaignsService: CampaignsService
  ) {}

  @Post('add')
  async startCampaign(@Body() startCampaignDto: StartCampaignDto) {
    try {
      console.log('QUEUE CONTROLLER - Starting campaign with DTO:', startCampaignDto);
      
      // Validate DTO first
      if (!startCampaignDto.campaignId) {
        throw new Error('campaignId is required');
      }
      
      // Verify campaign exists and is in QUEUED status
      const campaign = await this.campaignsService.findOne(startCampaignDto.campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${startCampaignDto.campaignId}`);
      }
      
      if (campaign.status !== 'QUEUED' && campaign.status !== 'DRAFT') {
        throw new Error(`Campaign cannot be started. Current status: ${campaign.status}`);
      }
      
      console.log('QUEUE CONTROLLER - DTO validation passed');
      
      // Update campaign status to RUNNING before processing
      await this.campaignsService.updateStatus(startCampaignDto.campaignId, 'RUNNING');
      
      // Process the job immediately (simplified queue implementation)
      console.log('QUEUE CONTROLLER - Calling queueProcessor.processJob...');
      await this.queueProcessor.processJob(startCampaignDto);
      
      console.log('QUEUE CONTROLLER - Campaign processed successfully');
      
      return {
        success: true,
        message: 'Campaign started and processed successfully',
        campaignId: startCampaignDto.campaignId,
        jobId: `job-${Date.now()}`,
      };
    } catch (error: any) {
      console.error('QUEUE CONTROLLER - ERROR:', error);
      console.error('QUEUE CONTROLLER - ERROR TYPE:', typeof error);
      console.error('QUEUE CONTROLLER - ERROR MESSAGE:', error?.message);
      console.error('QUEUE CONTROLLER - ERROR STACK:', error?.stack);
      console.error('QUEUE CONTROLLER - DTO RECEIVED:', startCampaignDto);
      
      // Return detailed error to frontend
      throw new HttpException(
        {
          error: 'Failed to start campaign',
          details: error?.message || 'Unknown error occurred',
          type: typeof error,
          receivedData: startCampaignDto
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
