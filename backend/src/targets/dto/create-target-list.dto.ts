import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateTargetListDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
