import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { StatsModule } from './stats/stats.module';
import { AccountsModule } from './accounts/accounts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { QueueModule } from './queue/queue.module';
import { SettingsModule } from './settings/settings.module';
import { LogsModule } from './logs/logs.module';
import { TargetsModule } from './targets/targets.module';
import { TemplatesModule } from './templates/templates.module';
import { BlueskyModule } from './bluesky/bluesky.module';
import { RedisModule } from './redis/redis.module';
import { SecurityModule } from './security/security.module';
import { SafetyModule } from './safety/safety.module';
import { FollowModule } from './follow/follow.module';

@Module({
  imports: [
    AppConfigModule, 
    PrismaModule, 
    HealthModule, 
    StatsModule,
    AccountsModule,
    CampaignsModule,
    QueueModule,
    SettingsModule,
    LogsModule,
    TargetsModule,
    TemplatesModule,
    BlueskyModule,
    RedisModule,
    SecurityModule,
    SafetyModule,
    FollowModule,
  ],
})
export class AppModule {}
