import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

// Public registration can only self-assign ORGANIZER or SPECTATOR.
// ADMIN and SCOREKEEPER are granted separately (SCOREKEEPER via
// MatchOfficial assignment by an organizer, ADMIN out-of-band) —
// never through this endpoint.
export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsIn(['ORGANIZER', 'SPECTATOR'])
  role?: 'ORGANIZER' | 'SPECTATOR';
}
