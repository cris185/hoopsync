import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  coachName?: string;

  @IsOptional()
  @IsString()
  coachPhotoUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
