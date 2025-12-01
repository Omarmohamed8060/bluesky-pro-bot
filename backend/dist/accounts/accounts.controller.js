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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
const accounts_service_1 = require("./accounts.service");
const create_account_dto_1 = require("./dto/create-account.dto");
let AccountsController = class AccountsController {
    constructor(accountsService) {
        this.accountsService = accountsService;
    }
    async create(createAccountDto) {
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
        }
        catch (error) {
            if (error.message.includes('already exists')) {
                throw new common_1.HttpException('Account with this handle already exists', common_1.HttpStatus.CONFLICT);
            }
            throw new common_1.HttpException('Failed to create account', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll() {
        const accounts = await this.accountsService.findAll();
        return accounts.map((account) => ({
            id: account.id,
            username: account.handle,
            did: account.did,
            isActive: account.cooldownUntil ? new Date() < account.cooldownUntil : true,
            createdAt: account.createdAt.toISOString(),
            lastUsedAt: account.lastLoginAt?.toISOString() || null,
        }));
    }
    async remove(id) {
        try {
            await this.accountsService.remove(id);
            return { message: 'Account deleted successfully' };
        }
        catch (error) {
            throw new common_1.HttpException('Failed to delete account', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_account_dto_1.CreateAccountDto]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "remove", null);
exports.AccountsController = AccountsController = __decorate([
    (0, common_1.Controller)('accounts'),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map