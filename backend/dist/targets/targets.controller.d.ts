import { TargetsService } from './targets.service';
import { CreateTargetListDto } from './dto/create-target-list.dto';
import { AddTargetsDto } from './dto/add-targets.dto';
export declare class TargetsController {
    private readonly targetsService;
    constructor(targetsService: TargetsService);
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
        id: string;
        name: string;
        description: string | null;
        targetsJson: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getTargetList(id: string): Promise<{
        targets: any;
        _count: {
            targets: any;
        };
        id: string;
        name: string;
        description: string | null;
        targetsJson: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addTargets(id: string, addTargetsDto: AddTargetsDto): Promise<{
        added: number;
        duplicates: number;
        invalid: number;
    }>;
    getTargets(id: string): Promise<any>;
    deleteTargetList(id: string): Promise<{
        message: string;
    }>;
    deleteTarget(id: string): Promise<{
        message: string;
    }>;
    importTargets(body: {
        targetListId: string;
        targetsText: string;
    }): Promise<{
        added: number;
        duplicates: number;
        invalid: number;
    }>;
    addFollowers(id: string, body: {
        followers: Array<{
            handle: string;
            did: string;
            displayName?: string;
        }>;
    }): Promise<{
        added: number;
        duplicates: number;
        invalid: number;
    }>;
}
