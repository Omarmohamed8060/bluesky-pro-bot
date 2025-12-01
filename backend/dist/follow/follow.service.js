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
var FollowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowService = void 0;
const common_1 = require("@nestjs/common");
const bluesky_service_1 = require("../bluesky/bluesky.service");
let FollowService = FollowService_1 = class FollowService {
    constructor(blueskyService) {
        this.blueskyService = blueskyService;
        this.logger = new common_1.Logger(FollowService_1.name);
    }
    async followUser(handle) {
        this.ensureHandle(handle);
        this.logger.log(`Following ${handle} using shared Bluesky agent`);
        return this.blueskyService.followUser(handle);
    }
    async getFollowers(handle) {
        this.ensureHandle(handle);
        this.logger.log(`Fetching followers for ${handle} using shared Bluesky agent`);
        return this.blueskyService.getFollowers(handle);
    }
    ensureHandle(handle) {
        if (!handle) {
            throw new common_1.HttpException({ error: 'handle is required' }, common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.FollowService = FollowService;
exports.FollowService = FollowService = FollowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bluesky_service_1.BlueskyService])
], FollowService);
//# sourceMappingURL=follow.service.js.map