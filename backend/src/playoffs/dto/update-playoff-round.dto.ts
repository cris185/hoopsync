import { PartialType } from '@nestjs/mapped-types';
import { CreatePlayoffRoundDto } from './create-playoff-round.dto';

export class UpdatePlayoffRoundDto extends PartialType(CreatePlayoffRoundDto) {}
