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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../security/encryption.service");
let AccountsService = class AccountsService {
    constructor(prisma, encryptionService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
    }
    async create(createAccountDto) {
        const { username, appPassword, displayName, label, rateLimitPerHour, rateLimitPerDay, } = createAccountDto;
        const normalizedHandle = username.trim().toLowerCase();
        const normalizedPassword = appPassword.trim();
        const normalizedDisplayName = displayName?.trim();
        const existingAccount = await this.prisma.account.findUnique({ where: { handle: normalizedHandle } });
        if (existingAccount) {
            throw new common_1.ConflictException('Account with this handle already exists');
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
    async findOne(id) {
        const account = await this.prisma.account.findUnique({ where: { id } });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        return account;
    }
    async updateStatus(id, status) {
        await this.findOne(id);
        return this.prisma.account.update({
            where: { id },
            data: { status },
        });
    }
    async updateRateLimits(id, rateLimitPerHour, rateLimitPerDay) {
        await this.findOne(id);
        return this.prisma.account.update({
            where: { id },
            data: {
                rateLimitPerHour,
                rateLimitPerDay,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.account.delete({ where: { id } });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map