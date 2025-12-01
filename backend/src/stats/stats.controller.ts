import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface StatsResponse {
  totalAccounts: number;
  activeAccounts: number;
  activeCampaigns: number;
  totalSent: number;
  failedCount: number;
}

@Controller('stats')
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getStats(): Promise<StatsResponse> {
    const [totalAccounts, activeAccounts, activeCampaigns, campaignTotals] = await Promise.all([
      this.prisma.account.count(),
      this.prisma.account.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      this.prisma.campaign.count({
        where: {
          status: {
            in: ['RUNNING', 'QUEUED'],
          },
        },
      }),
      this.prisma.campaign.aggregate({
        _sum: {
          sentCount: true,
          successCount: true,
        },
      }),
    ]);

    const totalSent = campaignTotals._sum.sentCount ?? 0;
    const successSent = campaignTotals._sum.successCount ?? 0;
    const failedCount = Math.max(totalSent - successSent, 0);

    return {
      totalAccounts,
      activeAccounts,
      activeCampaigns,
      totalSent,
      failedCount,
    };
  }
}
