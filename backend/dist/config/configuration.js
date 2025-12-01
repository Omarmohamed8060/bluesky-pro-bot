"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuration = void 0;
const configuration = () => ({
    app: {
        port: parseInt(process.env.APP_PORT ?? process.env.PORT ?? '3001', 10),
        frontendUrl: process.env.APP_FRONTEND_URL ?? process.env.FRONTEND_URL ?? 'http://localhost:3000',
    },
    database: {
        url: process.env.DATABASE_URL ?? '',
    },
    redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },
    security: {
        encryptionKey: process.env.ENCRYPTION_KEY ?? '',
    },
    bluesky: {
        serviceUrl: process.env.BLUESKY_SERVICE_URL ?? 'https://bsky.social',
        identifier: process.env.BLUESKY_IDENTIFIER ?? '',
        appPassword: process.env.BLUESKY_APP_PASSWORD ?? '',
    },
    queues: {
        dm: process.env.DM_QUEUE_NAME ?? 'dm-queue',
        post: process.env.POST_QUEUE_NAME ?? 'post-queue',
    },
});
exports.configuration = configuration;
//# sourceMappingURL=configuration.js.map