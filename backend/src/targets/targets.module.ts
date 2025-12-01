import { Module } from '@nestjs/common';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [TargetsController],
  providers: [TargetsService],
  imports: [PrismaModule],
  exports: [TargetsService],
})
export class TargetsModule {}
