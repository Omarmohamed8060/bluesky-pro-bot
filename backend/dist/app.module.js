"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("./config/config.module");
const health_module_1 = require("./health/health.module");
const prisma_module_1 = require("./prisma/prisma.module");
const stats_module_1 = require("./stats/stats.module");
const accounts_module_1 = require("./accounts/accounts.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const queue_module_1 = require("./queue/queue.module");
const settings_module_1 = require("./settings/settings.module");
const logs_module_1 = require("./logs/logs.module");
const targets_module_1 = require("./targets/targets.module");
const templates_module_1 = require("./templates/templates.module");
const bluesky_module_1 = require("./bluesky/bluesky.module");
const redis_module_1 = require("./redis/redis.module");
const security_module_1 = require("./security/security.module");
const safety_module_1 = require("./safety/safety.module");
const follow_module_1 = require("./follow/follow.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule,
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            stats_module_1.StatsModule,
            accounts_module_1.AccountsModule,
            campaigns_module_1.CampaignsModule,
            queue_module_1.QueueModule,
            settings_module_1.SettingsModule,
            logs_module_1.LogsModule,
            targets_module_1.TargetsModule,
            templates_module_1.TemplatesModule,
            bluesky_module_1.BlueskyModule,
            redis_module_1.RedisModule,
            security_module_1.SecurityModule,
            safety_module_1.SafetyModule,
            follow_module_1.FollowModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map