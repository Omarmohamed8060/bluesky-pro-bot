import { Module, forwardRef } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueProcessor } from './queue-processor.service';
import { QueueService } from './queue.service';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BlueskyModule } from '../bluesky/bluesky.module';
import { SafetyModule } from '../safety/safety.module';
import { TemplatesModule } from '../templates/templates.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  controllers: [QueueController],
  providers: [QueueProcessor, QueueService],
  exports: [QueueProcessor, QueueService],
  imports: [forwardRef(() => CampaignsModule), PrismaModule, BlueskyModule, SafetyModule, TemplatesModule, SettingsModule],
})
export class QueueModule {}
