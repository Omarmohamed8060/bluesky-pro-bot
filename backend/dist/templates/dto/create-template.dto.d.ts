export declare enum TemplateType {
    DM = "DM",
    POST = "POST"
}
export declare class CreateTemplateDto {
    name: string;
    type: TemplateType;
    body: string;
}
export declare class UpdateTemplateDto {
    name?: string;
    type?: TemplateType;
    body?: string;
}
