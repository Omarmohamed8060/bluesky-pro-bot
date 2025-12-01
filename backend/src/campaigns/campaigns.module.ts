import { Module, forwardRef } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountsModule } from '../accounts/accounts.module';
import { TemplatesModule } from '../templates/templates.module';
import { TargetsModule } from '../targets/targets.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
  imports: [PrismaModule, AccountsModule, TemplatesModule, TargetsModule, forwardRef(() => QueueModule)],
})
export class CampaignsModule {}
