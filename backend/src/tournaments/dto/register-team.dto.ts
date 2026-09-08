import { IsInt, IsOptional, IsString } from 'class-validator';

export class RegisterTeamDto {
  @IsString()
  teamId: string;

  @IsOptional()
  @IsInt()
  seed?: number;
}
