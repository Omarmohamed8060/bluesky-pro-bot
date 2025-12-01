import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<import("./settings.service").SettingsResponse>;
    updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<{
        success: boolean;
        message: string;
        settings: import("./settings.service").SettingsResponse;
    }>;
}
