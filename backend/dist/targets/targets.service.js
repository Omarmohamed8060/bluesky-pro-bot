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
var TargetsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TargetsService = TargetsService_1 = class TargetsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TargetsService_1.name);
    }
    async createTargetList(createTargetListDto) {
        const { name, description } = createTargetListDto;
        this.logger.log(`Creating target list: ${name}`);
        const targetList = await this.prisma.targetList.create({
            data: {
                name,
                description: description || null,
                targetsJson: '[]',
            },
        });
        this.logger.log(`Target list created successfully: ${targetList.id}`);
        return {
            id: targetList.id,
            name: targetList.name,
            description: targetList.description,
            targetsJson: targetList.targetsJson,
            createdAt: targetList.createdAt,
            updatedAt: targetList.updatedAt,
            _count: { targets: 0 }
        };
    }
    async getTargetLists() {
        const lists = await this.prisma.targetList.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        return lists.map(list => {
            const targets = JSON.parse(list.targetsJson || '[]');
            return {
                ...list,
                _count: { targets: targets.length }
            };
        });
    }
    async getTargetList(id) {
        const targetList = await this.prisma.targetList.findUnique({
            where: { id },
        });
        if (!targetList) {
            throw new Error(`Target list not found: ${id}`);
        }
        const targets = JSON.parse(targetList.targetsJson || '[]');
        return {
            ...targetList,
            targets: targets.map((handle, index) => ({
                id: `${id}-${index}`,
                handle,
                targetListId: id,
                createdAt: targetList.createdAt,
                updatedAt: targetList.updatedAt,
            })),
            _count: { targets: targets.length }
        };
    }
    async addTargets(targetListId, targets) {
        const targetList = await this.prisma.targetList.findUnique({
            where: { id: targetListId }
        });
        if (!targetList) {
            throw new Error(`Target list not found: ${targetListId}`);
        }
        const validTargets = targets.filter(target => {
            const trimmed = target?.trim();
            return trimmed && (trimmed.endsWith('.bsky.social') || trimmed.startsWith('did:'));
        });
        if (validTargets.length === 0) {
            throw new Error('No valid targets provided');
        }
        const existingTargets = JSON.parse(targetList.targetsJson || '[]');
        const existingSet = new Set(existingTargets);
        const newTargets = validTargets.filter(handle => !existingSet.has(handle));
        if (newTargets.length === 0) {
            throw new Error('All targets already exist in this list');
        }
        const updatedTargets = [...existingTargets, ...newTargets];
        await this.prisma.targetList.update({
            where: { id: targetListId },
            data: { targetsJson: JSON.stringify(updatedTargets) }
        });
        this.logger.log(`Added ${newTargets.length} targets to list ${targetListId}`);
        return {
            added: newTargets.length,
            duplicates: validTargets.length - newTargets.length,
            invalid: targets.length - validTargets.length,
        };
    }
    async getTargets(targetListId) {
        const targetList = await this.prisma.targetList.findUnique({
            where: { id: targetListId }
        });
        if (!targetList) {
            return [];
        }
        const targets = JSON.parse(targetList.targetsJson || '[]');
        return targets.map((handle, index) => ({
            id: `${targetListId}-${index}`,
            handle,
            targetListId,
            createdAt: targetList.createdAt,
            updatedAt: targetList.updatedAt,
        }));
    }
    async deleteTargetList(id) {
        const campaignsUsingList = await this.prisma.campaign.findMany({
            where: { targetListId: id }
        });
        if (campaignsUsingList.length > 0) {
            throw new Error('Cannot delete target list that is used in campaigns');
        }
        await this.prisma.targetList.delete({
            where: { id }
        });
        this.logger.log(`Target list deleted: ${id}`);
    }
    async deleteTarget(id) {
        const parts = id.split('-');
        const index = parseInt(parts[parts.length - 1]);
        const targetListId = parts.slice(0, -1).join('-');
        const targetList = await this.prisma.targetList.findUnique({
            where: { id: targetListId }
        });
        if (!targetList) {
            throw new Error('Target list not found');
        }
        const targets = JSON.parse(targetList.targetsJson || '[]');
        targets.splice(index, 1);
        await this.prisma.targetList.update({
            where: { id: targetListId },
            data: { targetsJson: JSON.stringify(targets) }
        });
        this.logger.log(`Target deleted from list ${targetListId}`);
    }
    async importTargets(targetListId, targetsText) {
        const targets = targetsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        if (targets.length === 0) {
            throw new Error('No targets provided');
        }
        return await this.addTargets(targetListId, targets);
    }
    async getTargetStats(targetListId) {
        const targetList = await this.prisma.targetList.findUnique({
            where: { id: targetListId },
        });
        if (!targetList) {
            throw new Error(`Target list not found: ${targetListId}`);
        }
        const targets = JSON.parse(targetList.targetsJson || '[]');
        const totalTargets = targets.length;
        const validHandles = targets.filter((t) => t && t.endsWith('.bsky.social')).length;
        const dids = targets.filter((t) => t && t.startsWith('did:')).length;
        const invalid = totalTargets - validHandles - dids;
        return {
            total: totalTargets,
            validHandles,
            dids,
            invalid,
            listName: targetList.name,
            createdAt: targetList.createdAt,
        };
    }
    async validateTarget(handle) {
        const trimmed = handle.trim();
        if (trimmed.endsWith('.bsky.social')) {
            const username = trimmed.slice(0, -'.bsky.social'.length);
            return username.length > 0 && /^[a-zA-Z0-9.-]+$/.test(username);
        }
        if (trimmed.startsWith('did:')) {
            return /^did:[a-z0-9]+:[a-zA-Z0-9._-]+$/.test(trimmed);
        }
        return false;
    }
};
exports.TargetsService = TargetsService;
exports.TargetsService = TargetsService = TargetsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TargetsService);
//# sourceMappingURL=targets.service.js.map