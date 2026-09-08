import { IsOptional, IsString } from 'class-validator';

export class UpdateOcrFieldDto {
  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  @IsString()
  matchedPlayerId?: string;
}
