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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../security/encryption.service");
const DEFAULT_SETTINGS = {
    botName: 'Bluesky Pro Bot',
    language: 'en',
    maxDmsPerHour: 20,
    maxDmsPerDay: 200,
    delayBetweenActions: 5,
    appPassword: '',
};
let SettingsService = SettingsService_1 = class SettingsService {
    constructor(prisma, encryptionService) {
        this.prisma = prisma;
        this.encryptionService = encryptionService;
    }
    async readCoreSettings() {
        const record = await this.prisma.setting.findUnique({
            where: { key: SettingsService_1.SETTINGS_KEY },
        });
        if (!record) {
            return { ...DEFAULT_SETTINGS };
        }
        const value = record.value ? JSON.parse(record.value) : {};
        const appPasswordEncrypted = value.appPasswordEncrypted ?? null;
        let appPassword = '';
        if (appPasswordEncrypted) {
            try {
                appPassword = this.encryptionService.decrypt(appPasswordEncrypted);
            }
            catch (error) {
                appPassword = '';
            }
        }
        return {
            botName: value.botName ?? DEFAULT_SETTINGS.botName,
            language: value.language ?? DEFAULT_SETTINGS.language,
            maxDmsPerHour: value.maxDmsPerHour ?? DEFAULT_SETTINGS.maxDmsPerHour,
            maxDmsPerDay: value.maxDmsPerDay ?? DEFAULT_SETTINGS.maxDmsPerDay,
            delayBetweenActions: value.delayBetweenActions ?? DEFAULT_SETTINGS.delayBetweenActions,
            appPassword,
        };
    }
    async getCoreSettings() {
        return this.readCoreSettings();
    }
    async getSettings() {
        const [settings, automationStats] = await Promise.all([
            this.readCoreSettings(),
            this.getAutomationStats(),
        ]);
        return {
            ...settings,
            automationStats,
        };
    }
    async updateSettings(partial) {
        const current = await this.readCoreSettings();
        const next = {
            ...current,
            ...partial,
        };
        let appPasswordEncrypted = null;
        if (typeof partial.appPassword === 'string') {
            if (partial.appPassword.trim().length > 0) {
                appPasswordEncrypted = this.encryptionService.encrypt(partial.appPassword.trim());
            }
            else {
                appPasswordEncrypted = null;
                next.appPassword = '';
            }
        }
        else if (current.appPassword) {
            appPasswordEncrypted = this.encryptionService.encrypt(current.appPassword);
        }
        const persistValue = {
            botName: next.botName,
            language: next.language,
            maxDmsPerHour: next.maxDmsPerHour,
            maxDmsPerDay: next.maxDmsPerDay,
            delayBetweenActions: next.delayBetweenActions,
            appPasswordEncrypted: appPasswordEncrypted,
        };
        await this.prisma.setting.upsert({
            where: { key: SettingsService_1.SETTINGS_KEY },
            update: { value: JSON.stringify(persistValue) },
            create: { key: SettingsService_1.SETTINGS_KEY, value: JSON.stringify(persistValue) },
        });
        return this.getSettings();
    }
    async getAutomationStats() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const [dmSentLastHour, dmSentLastDay, activeAccounts, accountsInCooldown] = await Promise.all([
            this.prisma.logEntry.count({
                where: {
                    level: 'INFO',
                    message: {
                        contains: 'Successfully sent dm',
                    },
                    createdAt: {
                        gte: oneHourAgo,
                    },
                },
            }),
            this.prisma.logEntry.count({
                where: {
                    level: 'INFO',
                    message: {
                        contains: 'Successfully sent dm',
                    },
                    createdAt: {
                        gte: oneDayAgo,
                    },
                },
            }),
            this.prisma.account.count({
                where: {
                    status: 'ACTIVE',
                },
            }),
            this.prisma.account.count({
                where: {
                    cooldownUntil: {
                        gt: now,
                    },
                },
            }),
        ]);
        return {
            dmSentLastHour,
            dmSentLastDay,
            activeAccounts,
            accountsInCooldown,
        };
    }
};
exports.SettingsService = SettingsService;
SettingsService.SETTINGS_KEY = 'global_settings';
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map