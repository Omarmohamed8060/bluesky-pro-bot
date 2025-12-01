import { Injectable } from '@nestjs/common';
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

type PersistedSettings = {
  botName: string;
  language: 'en' | 'ar';
  maxDmsPerHour: number;
  maxDmsPerDay: number;
  delayBetweenActions: number;
  appPasswordEncrypted?: string | null;
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

const DEFAULT_SETTINGS: CoreSettings = {
  botName: 'Bluesky Pro Bot',
  language: 'en',
  maxDmsPerHour: 20,
  maxDmsPerDay: 200,
  delayBetweenActions: 5,
  appPassword: '',
};

@Injectable()
export class SettingsService {
  private static readonly SETTINGS_KEY = 'global_settings';

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  private async readCoreSettings(): Promise<CoreSettings> {
    const record = await this.prisma.setting.findUnique({
      where: { key: SettingsService.SETTINGS_KEY },
    });

    if (!record) {
      return { ...DEFAULT_SETTINGS };
    }

    const value = record.value ? JSON.parse(record.value) as PersistedSettings : ({} as PersistedSettings);
    const appPasswordEncrypted = value.appPasswordEncrypted ?? null;
    let appPassword = '';

    if (appPasswordEncrypted) {
      try {
        appPassword = this.encryptionService.decrypt(appPasswordEncrypted);
      } catch (error) {
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

  async getCoreSettings(): Promise<CoreSettings> {
    return this.readCoreSettings();
  }

  async getSettings(): Promise<SettingsResponse> {
    const [settings, automationStats] = await Promise.all([
      this.readCoreSettings(),
      this.getAutomationStats(),
    ]);

    return {
      ...settings,
      automationStats,
    };
  }

  async updateSettings(partial: Partial<CoreSettings>): Promise<SettingsResponse> {
    const current = await this.readCoreSettings();
    const next: CoreSettings = {
      ...current,
      ...partial,
    };

    let appPasswordEncrypted: string | null = null;
    if (typeof partial.appPassword === 'string') {
      if (partial.appPassword.trim().length > 0) {
        appPasswordEncrypted = this.encryptionService.encrypt(partial.appPassword.trim());
      } else {
        appPasswordEncrypted = null;
        next.appPassword = '';
      }
    } else if (current.appPassword) {
      appPasswordEncrypted = this.encryptionService.encrypt(current.appPassword);
    }

    const persistValue: PersistedSettings = {
      botName: next.botName,
      language: next.language,
      maxDmsPerHour: next.maxDmsPerHour,
      maxDmsPerDay: next.maxDmsPerDay,
      delayBetweenActions: next.delayBetweenActions,
      appPasswordEncrypted: appPasswordEncrypted,
    };

    await this.prisma.setting.upsert({
      where: { key: SettingsService.SETTINGS_KEY },
      update: { value: JSON.stringify(persistValue) },
      create: { key: SettingsService.SETTINGS_KEY, value: JSON.stringify(persistValue) },
    });

    return this.getSettings();
  }

  async getAutomationStats(): Promise<AutomationStats> {
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
}
