import { Controller, Get, Post, Delete, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    try {
      const account = await this.accountsService.create(createAccountDto);
      return {
        id: account.id,
        username: account.handle,
        did: account.did,
        isActive: true,
        createdAt: account.createdAt.toISOString(),
        lastUsedAt: account.lastLoginAt?.toISOString() || null,
      };
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        throw new HttpException('Account with this handle already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create account', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll() {
    const accounts = await this.accountsService.findAll();
    return accounts.map((account: any) => ({
      id: account.id,
      username: account.handle,
      did: account.did,
      isActive: account.cooldownUntil ? new Date() < account.cooldownUntil : true,
      createdAt: account.createdAt.toISOString(),
      lastUsedAt: account.lastLoginAt?.toISOString() || null,
    }));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.accountsService.remove(id);
      return { message: 'Account deleted successfully' };
    } catch (error: any) {
      throw new HttpException('Failed to delete account', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
