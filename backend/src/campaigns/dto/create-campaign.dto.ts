import { IsString, IsNotEmpty, IsEnum, IsArray } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(['dm', 'post'])
  type!: 'dm' | 'post';

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsArray()
  @IsString({ each: true })
  targets!: string[]; // Changed from targetList to targets to match frontend

  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
