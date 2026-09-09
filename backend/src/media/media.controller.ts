import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService, type MediaKind } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// score-sheet is deliberately not reachable through this general
// endpoint — it has its own upload path (POST /matches/:id/score-sheet)
// gated by per-match scoring permission, not just an ORGANIZER/ADMIN
// role check, and it needs PDF handling this generic endpoint doesn't do.
const PUBLIC_MEDIA_KINDS: MediaKind[] = ['team-logo', 'coach-photo', 'player-photo'];

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // Same permission level as creating/editing the team or player these
  // photos belong to — teams aren't owned by a single user, so it's a
  // role check rather than an ownership one, matching TeamsController
  // and PlayersController.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @Post(':kind')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Only jpg, jpeg, png or webp images are allowed'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async upload(@Param('kind') kind: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('An image file is required');
    }
    if (!PUBLIC_MEDIA_KINDS.includes(kind as MediaKind)) {
      throw new BadRequestException(`kind must be one of: ${PUBLIC_MEDIA_KINDS.join(', ')}`);
    }
    const url = await this.mediaService.upload(kind as MediaKind, file);
    return { url };
  }
}
