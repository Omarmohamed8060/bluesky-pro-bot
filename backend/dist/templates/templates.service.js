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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TemplatesService = class TemplatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(type) {
        const where = type ? { type } : {};
        return this.prisma.template.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const result = await this.prisma.template.findUnique({
            where: { id },
        });
        if (!result) {
            throw new common_1.NotFoundException(`Template with ID ${id} not found`);
        }
        return result;
    }
    async create(createTemplateDto) {
        return this.prisma.template.create({
            data: {
                name: createTemplateDto.name,
                type: createTemplateDto.type,
                body: createTemplateDto.body,
            },
        });
    }
    async update(id, updateTemplateDto) {
        await this.findOne(id);
        const updateData = {};
        if (updateTemplateDto.name)
            updateData.name = updateTemplateDto.name;
        if (updateTemplateDto.type)
            updateData.type = updateTemplateDto.type;
        if (updateTemplateDto.body)
            updateData.body = updateTemplateDto.body;
        return this.prisma.template.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.template.delete({
            where: { id },
        });
    }
    async renderTemplate(templateId, variables) {
        const template = await this.findOne(templateId);
        let rendered = template.body;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, value);
        }
        return rendered;
    }
};
exports.TemplatesService = TemplatesService;
exports.TemplatesService = TemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TemplatesService);
//# sourceMappingURL=templates.service.js.map