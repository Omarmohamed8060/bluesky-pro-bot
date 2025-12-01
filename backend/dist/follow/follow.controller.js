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
var FollowController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowController = void 0;
const common_1 = require("@nestjs/common");
const follow_service_1 = require("./follow.service");
let FollowController = FollowController_1 = class FollowController {
    constructor(followService) {
        this.followService = followService;
        this.logger = new common_1.Logger(FollowController_1.name);
    }
    async followUser(body) {
        try {
            const { handle } = body;
            const result = await this.followService.followUser(handle);
            return {
                success: true,
                handle: result.handle,
                detail: result.detail,
            };
        }
        catch (error) {
            this.logger.error(`Error following user: ${error.message}`);
            throw new common_1.HttpException({
                error: 'Failed to follow user',
                details: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getFollowers(handle) {
        try {
            const followers = await this.followService.getFollowers(handle);
            return {
                success: true,
                handle,
                followers,
                count: followers.length,
            };
        }
        catch (error) {
            this.logger.error(`Error getting followers: ${error.message}`);
            throw new common_1.HttpException({
                error: 'Failed to get followers',
                details: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.FollowController = FollowController;
__decorate([
    (0, common_1.Post)('follow'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FollowController.prototype, "followUser", null);
__decorate([
    (0, common_1.Get)('followers/:handle'),
    __param(0, (0, common_1.Param)('handle')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowController.prototype, "getFollowers", null);
exports.FollowController = FollowController = FollowController_1 = __decorate([
    (0, common_1.Controller)('follow'),
    __metadata("design:paramtypes", [follow_service_1.FollowService])
], FollowController);
//# sourceMappingURL=follow.controller.js.map