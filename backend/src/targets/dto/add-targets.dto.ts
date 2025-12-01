import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class AddTargetsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  targets!: string[];
}
