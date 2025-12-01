import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async findRecent(@Query('limit') limit = '100') {
    const take = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);
    return this.logsService.findRecent(take);
  }
}
