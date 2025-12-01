import { IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  botName?: string;

  @IsString()
  @IsOptional()
  @IsIn(['en', 'ar'])
  language?: 'en' | 'ar';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(1000)
  maxDmsPerHour?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5000)
  maxDmsPerDay?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(600)
  delayBetweenActions?: number;

  @IsString()
  @IsOptional()
  appPassword?: string;
}
