import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlueskyService } from './bluesky.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, SecurityModule],
  providers: [BlueskyService],
  exports: [BlueskyService],
})
export class BlueskyModule {}
