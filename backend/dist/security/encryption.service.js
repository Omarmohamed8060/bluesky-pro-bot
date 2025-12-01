"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
let EncryptionService = class EncryptionService {
    constructor(configService) {
        this.configService = configService;
        const secret = this.configService.get('security.encryptionKey', {
            infer: true,
        });
        if (!secret || secret.length !== 32) {
            throw new common_1.InternalServerErrorException('Invalid encryption key length');
        }
        this.key = Buffer.from(secret, 'utf8');
    }
    encrypt(plainText) {
        const iv = crypto_1.default.randomBytes(IV_LENGTH);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, this.key, iv, {
            authTagLength: TAG_LENGTH,
        });
        const ciphertext = Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, ciphertext]).toString('base64');
    }
    decrypt(payload) {
        const buffer = Buffer.from(payload, 'base64');
        const iv = buffer.subarray(0, IV_LENGTH);
        const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
        const ciphertext = buffer.subarray(IV_LENGTH + TAG_LENGTH);
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, this.key, iv, {
            authTagLength: TAG_LENGTH,
        });
        decipher.setAuthTag(tag);
        const plain = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        return plain.toString('utf8');
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map