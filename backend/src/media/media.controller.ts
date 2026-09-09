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
import { MediaService, MEDIA_FOLDERS, type MediaKind } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

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
    if (!(kind in MEDIA_FOLDERS)) {
      throw new BadRequestException(`kind must be one of: ${Object.keys(MEDIA_FOLDERS).join(', ')}`);
    }
    const url = await this.mediaService.upload(kind as MediaKind, file);
    return { url };
  }
}
