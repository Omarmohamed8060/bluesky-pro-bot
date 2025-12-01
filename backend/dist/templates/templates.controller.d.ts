import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateType } from './dto/create-template.dto';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
    findAll(type?: TemplateType): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: string;
        body: string;
    }[]>;
    findOne(id: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: string;
        body: string;
    }>;
    create(createTemplateDto: CreateTemplateDto): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: string;
        body: string;
    }>;
    update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: string;
        body: string;
    }>;
    remove(id: string): Promise<void>;
}
