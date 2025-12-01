import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../security/encryption.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService
  ) {}

  async create(createAccountDto: CreateAccountDto) {
    const {
      username,
      appPassword,
      displayName,
      label,
      rateLimitPerHour,
      rateLimitPerDay,
    } = createAccountDto;

    const normalizedHandle = username.trim().toLowerCase();
    const normalizedPassword = appPassword.trim();
    const normalizedDisplayName = displayName?.trim();

    const existingAccount = await this.prisma.account.findUnique({ where: { handle: normalizedHandle } });
    if (existingAccount) {
      throw new ConflictException('Account with this handle already exists');
    }

    const encryptedPassword = this.encryptionService.encrypt(normalizedPassword);

    return this.prisma.account.create({
      data: {
        handle: normalizedHandle,
        encryptedAppPassword: encryptedPassword,
        displayName: normalizedDisplayName || username.trim(),
        label,
        rateLimitPerHour: rateLimitPerHour ?? 20,
        rateLimitPerDay: rateLimitPerDay ?? 200,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'DISABLED' | 'RATE_LIMITED' | 'BANNED' | 'INVALID') {
    await this.findOne(id);
    return this.prisma.account.update({
      where: { id },
      data: { status },
    });
  }

  async updateRateLimits(id: string, rateLimitPerHour: number, rateLimitPerDay: number) {
    await this.findOne(id);
    return this.prisma.account.update({
      where: { id },
      data: {
        rateLimitPerHour,
        rateLimitPerDay,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.account.delete({ where: { id } });
  }
}
