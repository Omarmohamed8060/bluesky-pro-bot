"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueskyModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bluesky_service_1 = require("./bluesky.service");
const prisma_module_1 = require("../prisma/prisma.module");
const redis_module_1 = require("../redis/redis.module");
const security_module_1 = require("../security/security.module");
let BlueskyModule = class BlueskyModule {
};
exports.BlueskyModule = BlueskyModule;
exports.BlueskyModule = BlueskyModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule, redis_module_1.RedisModule, security_module_1.SecurityModule],
        providers: [bluesky_service_1.BlueskyService],
        exports: [bluesky_service_1.BlueskyService],
    })
], BlueskyModule);
//# sourceMappingURL=bluesky.module.js.map