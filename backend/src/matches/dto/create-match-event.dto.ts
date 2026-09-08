import { MatchEventType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMatchEventDto {
  @IsString()
  teamId: string;

  @IsOptional()
  @IsString()
  playerId?: string;

  // SUBSTITUTION only: the player coming out (playerId is the player
  // coming in).
  @IsOptional()
  @IsString()
  relatedPlayerId?: string;

  @IsEnum(MatchEventType)
  eventType: MatchEventType;

  @IsOptional()
  @IsInt()
  value?: number;

  @IsInt()
  @Min(1)
  period: number;

  @IsInt()
  @Min(0)
  clockSeconds: number;
}
