import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../security/encryption.service';
type CoreSettings = {
    botName: string;
    language: 'en' | 'ar';
    maxDmsPerHour: number;
    maxDmsPerDay: number;
    delayBetweenActions: number;
    appPassword: string;
};
type AutomationStats = {
    dmSentLastHour: number;
    dmSentLastDay: number;
    activeAccounts: number;
    accountsInCooldown: number;
};
export type SettingsResponse = CoreSettings & {
    automationStats: AutomationStats;
};
export declare class SettingsService {
    private readonly prisma;
    private readonly encryptionService;
    private static readonly SETTINGS_KEY;
    constructor(prisma: PrismaService, encryptionService: EncryptionService);
    private readCoreSettings;
    getCoreSettings(): Promise<CoreSettings>;
    getSettings(): Promise<SettingsResponse>;
    updateSettings(partial: Partial<CoreSettings>): Promise<SettingsResponse>;
    getAutomationStats(): Promise<AutomationStats>;
}
export {};
