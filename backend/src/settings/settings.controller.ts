import { Controller, Get, Post, Body } from '@nestjs/common';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Post()
  async updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    const settings = await this.settingsService.updateSettings(updateSettingsDto);
    return {
      success: true,
      message: 'Settings saved successfully',
      settings,
    };
  }
}
