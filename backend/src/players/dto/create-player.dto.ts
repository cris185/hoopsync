import { PlayerPosition } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsInt()
  @Min(0)
  @Max(99)
  jerseyNumber: number;

  @IsOptional()
  @IsEnum(PlayerPosition)
  position?: PlayerPosition;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
