import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host', { infer: true }),
      port: this.configService.get<number>('redis.port', { infer: true }),
      password: this.configService.get<string>('redis.password') ?? undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    this.client.on('error', (error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Redis connection error', err.stack);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  duplicate(): Redis {
    return this.client.duplicate();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
