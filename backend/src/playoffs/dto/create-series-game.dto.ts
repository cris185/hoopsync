import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSeriesGameDto {
  // Must be the series' teamAId or teamBId — the other team is
  // inferred automatically.
  @IsString()
  homeTeamId: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  venue?: string;
}
