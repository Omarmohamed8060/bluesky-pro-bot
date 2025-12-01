import { Module } from '@nestjs/common';
import { BlueskyService } from './bluesky-simple.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [BlueskyService],
  imports: [PrismaModule],
  exports: [BlueskyService],
})
export class BlueskyModule {}
