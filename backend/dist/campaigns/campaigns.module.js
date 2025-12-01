"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsModule = void 0;
const common_1 = require("@nestjs/common");
const campaigns_controller_1 = require("./campaigns.controller");
const campaigns_service_1 = require("./campaigns.service");
const prisma_module_1 = require("../prisma/prisma.module");
const accounts_module_1 = require("../accounts/accounts.module");
const templates_module_1 = require("../templates/templates.module");
const targets_module_1 = require("../targets/targets.module");
const queue_module_1 = require("../queue/queue.module");
let CampaignsModule = class CampaignsModule {
};
exports.CampaignsModule = CampaignsModule;
exports.CampaignsModule = CampaignsModule = __decorate([
    (0, common_1.Module)({
        controllers: [campaigns_controller_1.CampaignsController],
        providers: [campaigns_service_1.CampaignsService],
        exports: [campaigns_service_1.CampaignsService],
        imports: [prisma_module_1.PrismaModule, accounts_module_1.AccountsModule, templates_module_1.TemplatesModule, targets_module_1.TargetsModule, (0, common_1.forwardRef)(() => queue_module_1.QueueModule)],
    })
], CampaignsModule);
//# sourceMappingURL=campaigns.module.js.map