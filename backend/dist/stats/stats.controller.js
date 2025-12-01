"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StatsController = class StatsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
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
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getStats", null);
exports.StatsController = StatsController = __decorate([
    (0, common_1.Controller)('stats'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatsController);
//# sourceMappingURL=stats.controller.js.map