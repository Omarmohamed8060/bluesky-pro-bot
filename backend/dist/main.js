"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port', { infer: true });
    const globalPrefix = 'api/v1';
    app.setGlobalPrefix(globalPrefix, {
        exclude: ['/health'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const frontendOrigin = configService.get('app.frontendUrl', {
        infer: true,
    });
    app.enableCors({
        origin: frontendOrigin ? [frontendOrigin] : true,
        credentials: true,
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
    }));
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`🚀 API running at http://localhost:${port}/${globalPrefix}`);
}
bootstrap();
//# sourceMappingURL=main.js.map