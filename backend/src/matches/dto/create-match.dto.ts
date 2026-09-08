import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  homeTeamId: string;

  @IsString()
  awayTeamId: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsInt()
  matchday?: number;
}
