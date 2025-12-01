import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
  imports: [PrismaModule, SecurityModule],
})
export class AccountsModule {}
