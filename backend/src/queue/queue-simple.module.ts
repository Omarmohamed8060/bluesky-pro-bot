import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue-simple.service';
import { QueueProcessor } from './queue-processor.service';
import { BlueskyModule } from '../bluesky/bluesky-simple.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SafetyModule } from '../safety/safety.module';

@Module({
  controllers: [QueueController],
  providers: [QueueService, QueueProcessor],
  imports: [BlueskyModule, PrismaModule, SafetyModule],
  exports: [QueueService],
})
export class QueueModule {}
