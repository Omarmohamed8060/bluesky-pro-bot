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
exports.TargetsController = void 0;
const common_1 = require("@nestjs/common");
const targets_service_1 = require("./targets.service");
const create_target_list_dto_1 = require("./dto/create-target-list.dto");
const add_targets_dto_1 = require("./dto/add-targets.dto");
let TargetsController = class TargetsController {
    constructor(targetsService) {
        this.targetsService = targetsService;
    }
    async createTargetList(createTargetListDto) {
        try {
            console.log('[TargetsController] Creating target list:', createTargetListDto);
            const result = await this.targetsService.createTargetList(createTargetListDto);
            console.log('[TargetsController] Target list created successfully:', result.id);
            return result;
        }
        catch (error) {
            console.error('[TargetsController] Failed to create target list:', error);
            throw new common_1.HttpException({
                error: 'Failed to create target list',
                details: error.message,
                stack: error.stack
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTargetLists() {
        return await this.targetsService.getTargetLists();
    }
    async getTargetList(id) {
        try {
            return await this.targetsService.getTargetList(id);
        }
        catch (error) {
            throw new common_1.HttpException({ error: 'Target list not found', details: error.message }, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async addTargets(id, addTargetsDto) {
        try {
            return await this.targetsService.addTargets(id, addTargetsDto.targets);
        }
        catch (error) {
            throw new common_1.HttpException({ error: 'Failed to add targets', details: error.message }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getTargets(id) {
        try {
            return await this.targetsService.getTargets(id);
        }
        catch (error) {
            throw new common_1.HttpException({ error: 'Failed to get targets', details: error.message }, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async deleteTargetList(id) {
        try {
            await this.targetsService.deleteTargetList(id);
            return { message: 'Target list deleted successfully' };
        }
        catch (error) {
            throw new common_1.HttpException({ error: 'Failed to delete target list', details: error.message }, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async deleteTarget(id) {
        try {
            await this.targetsService.deleteTarget(id);
            return { message: 'Target deleted successfully' };
        }
        catch (error) {
            throw new common_1.HttpException({ error: 'Failed to delete target', details: error.message }, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async importTargets(body) {
        try {
            return await this.targetsService.importTargets(body.targetListId, body.targetsText);
        }
        catch (error) {
            throw new common_1.HttpException({ error: 'Failed to import targets', details: error.message }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async addFollowers(id, body) {
        try {
            const targets = body.followers.map(follower => follower.handle);
            return await this.targetsService.addTargets(id, targets);
        }
        catch (error) {
            throw new common_1.HttpException({ error: 'Failed to add followers to target list', details: error.message }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.TargetsController = TargetsController;
__decorate([
    (0, common_1.Post)('lists'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_target_list_dto_1.CreateTargetListDto]),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "createTargetList", null);
__decorate([
    (0, common_1.Get)('lists'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "getTargetLists", null);
__decorate([
    (0, common_1.Get)('lists/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "getTargetList", null);
__decorate([
    (0, common_1.Post)('lists/:id/targets'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_targets_dto_1.AddTargetsDto]),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "addTargets", null);
__decorate([
    (0, common_1.Get)('lists/:id/targets'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "getTargets", null);
__decorate([
    (0, common_1.Delete)('lists/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "deleteTargetList", null);
__decorate([
    (0, common_1.Delete)('targets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "deleteTarget", null);
__decorate([
    (0, common_1.Post)('import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "importTargets", null);
__decorate([
    (0, common_1.Post)('lists/:id/add-followers'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TargetsController.prototype, "addFollowers", null);
exports.TargetsController = TargetsController = __decorate([
    (0, common_1.Controller)('targets'),
    __metadata("design:paramtypes", [targets_service_1.TargetsService])
], TargetsController);
//# sourceMappingURL=targets.controller.js.map