import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ScoreSheetsService } from './score-sheets.service';
import { UpdateOcrFieldDto } from './dto/update-ocr-field.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SafeUser } from '../users/users.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

@Controller()
export class ScoreSheetsController {
  constructor(private readonly scoreSheetsService: ScoreSheetsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('matches/:matchId/score-sheet')
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
  upload(
    @Param('matchId') matchId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: SafeUser,
  ) {
    if (!file) {
      throw new BadRequestException('An image file is required');
    }
    return this.scoreSheetsService.upload(matchId, file, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('matches/:matchId/score-sheet')
  getForMatch(@Param('matchId') matchId: string, @CurrentUser() user: SafeUser) {
    return this.scoreSheetsService.getForMatch(matchId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('score-sheets/:id/reprocess')
  reprocess(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.scoreSheetsService.reprocess(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('score-sheets/fields/:fieldId')
  updateField(
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateOcrFieldDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.scoreSheetsService.updateField(fieldId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('score-sheets/:id/validate')
  validate(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.scoreSheetsService.validate(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('score-sheets/:id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.scoreSheetsService.reject(id, user);
  }
}
