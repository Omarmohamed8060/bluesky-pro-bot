import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { configuration } from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        PORT: Joi.number().default(4000),
        FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
        DATABASE_URL: Joi.string().uri().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('', null),
        ENCRYPTION_KEY: Joi.string().length(32).required(),
        BLUESKY_SERVICE_URL: Joi.string()
          .uri()
          .default('https://bsky.social'),
        BLUESKY_IDENTIFIER: Joi.string().optional(),
        BLUESKY_APP_PASSWORD: Joi.string().optional(),
        DM_QUEUE_NAME: Joi.string().default('dm-queue'),
        POST_QUEUE_NAME: Joi.string().default('post-queue'),
      }),
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
})
export class AppConfigModule {}
