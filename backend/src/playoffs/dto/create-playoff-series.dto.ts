import { IsString } from 'class-validator';

export class CreatePlayoffSeriesDto {
  @IsString()
  teamAId: string;

  @IsString()
  teamBId: string;
}
