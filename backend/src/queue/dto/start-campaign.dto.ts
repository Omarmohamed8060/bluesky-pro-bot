import { IsString, IsEnum, IsArray, IsNotEmpty } from 'class-validator';

export class StartCampaignDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string; // Added campaignId

  @IsEnum(['dm', 'post'])
  type!: 'dm' | 'post';

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsArray()
  @IsString({ each: true })
  targets!: string[];

  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
