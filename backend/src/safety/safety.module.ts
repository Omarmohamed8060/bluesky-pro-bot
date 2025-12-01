import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class SafetyModule {}
