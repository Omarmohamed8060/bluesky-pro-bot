import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  appPassword!: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  rateLimitPerHour?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  rateLimitPerDay?: number;
}
