import { IsIn, IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreatePlayoffRoundDto {
  @IsString()
  @MinLength(2)
  name: string;

  // Sequence within the tournament — 1 = first round (e.g.
  // Quarterfinals), higher numbers advance toward the Final.
  @IsInt()
  @Min(1)
  order: number;

  @IsIn([1, 3, 5, 7])
  bestOf: number;
}
