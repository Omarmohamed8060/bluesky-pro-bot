import { PrismaService } from '../prisma/prisma.service';
import { CreateTargetListDto } from './dto/create-target-list.dto';
export declare class TargetsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createTargetList(createTargetListDto: CreateTargetListDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        targetsJson: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            targets: number;
        };
    }>;
    getTargetLists(): Promise<{
        _count: {
            targets: any;
        };
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        targetsJson: string;
    }[]>;
    getTargetList(id: string): Promise<{
        targets: any;
        _count: {
            targets: any;
        };
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        targetsJson: string;
    }>;
    addTargets(targetListId: string, targets: string[]): Promise<{
        added: number;
        duplicates: number;
        invalid: number;
    }>;
    getTargets(targetListId: string): Promise<any>;
    deleteTargetList(id: string): Promise<void>;
    deleteTarget(id: string): Promise<void>;
    importTargets(targetListId: string, targetsText: string): Promise<{
        added: number;
        duplicates: number;
        invalid: number;
    }>;
    getTargetStats(targetListId: string): Promise<{
        total: any;
        validHandles: any;
        dids: any;
        invalid: number;
        listName: string;
        createdAt: Date;
    }>;
    validateTarget(handle: string): Promise<boolean>;
}
