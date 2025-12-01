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
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LogsService = class LogsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { page, limit, level, campaignId, accountId } = params;
        const skip = (page - 1) * limit;
        const where = {};
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
    async create(data) {
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
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LogsService);
//# sourceMappingURL=logs.service.js.map