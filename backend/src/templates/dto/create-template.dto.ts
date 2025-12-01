import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';

export enum TemplateType {
  DM = 'DM',
  POST = 'POST'
}

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(TemplateType)
  type!: TemplateType;

  @IsString()
  @MinLength(1)
  body!: string;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @IsEnum(TemplateType)
  @IsOptional()
  type?: TemplateType;

  @IsString()
  @IsOptional()
  @MinLength(1)
  body?: string;
}
