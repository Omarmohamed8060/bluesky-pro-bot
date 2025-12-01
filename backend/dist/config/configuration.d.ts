export declare const configuration: () => {
    app: {
        port: number;
        frontendUrl: string;
    };
    database: {
        url: string;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    security: {
        encryptionKey: string;
    };
    bluesky: {
        serviceUrl: string;
        identifier: string;
        appPassword: string;
    };
    queues: {
        dm: string;
        post: string;
    };
};
type Configuration = ReturnType<typeof configuration>;
export type AppConfig = Configuration['app'];
export type DatabaseConfig = Configuration['database'];
export type RedisConfig = Configuration['redis'];
export type SecurityConfig = Configuration['security'];
export type BlueskyConfig = Configuration['bluesky'];
export type QueuesConfig = Configuration['queues'];
export {};
