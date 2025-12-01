import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllParams {
  page: number;
  limit: number;
  level?: string;
  campaignId?: string;
  accountId?: string;
}

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const { page, limit, level, campaignId, accountId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (level) {
      where.level = level;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    return this.prisma.logEntry.findMany({
      where,
      include: {
        account: {
          select: { handle: true }
        },
        campaign: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
  }

  async findRecent(limit = 100) {
    return this.prisma.logEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        account: { select: { handle: true } },
        campaign: { select: { name: true } },
      },
    });
  }

  async getStats() {
    const [total, info, warn, error] = await Promise.all([
      this.prisma.logEntry.count(),
      this.prisma.logEntry.count({ where: { level: 'INFO' } }),
      this.prisma.logEntry.count({ where: { level: 'WARN' } }),
      this.prisma.logEntry.count({ where: { level: 'ERROR' } }),
    ]);

    return {
      total,
      info,
      warn,
      error,
    };
  }

  async create(data: {
    level?: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    accountId?: string;
    campaignId?: string;
    targetId?: string;
    metadata?: any;
  }) {
    return this.prisma.logEntry.create({
      data: {
        level: data.level || 'INFO',
        message: data.message,
        accountId: data.accountId || null,
        campaignId: data.campaignId || null,
        metadata: data.metadata,
      },
    });
  }
}
