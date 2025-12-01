import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [StatsController],
  imports: [PrismaModule],
})
export class StatsModule {}
