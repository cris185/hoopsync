import { BadGatewayException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesService } from '../matches/matches.service';
import { MediaService } from '../media/media.service';
import { SafeUser } from '../users/users.service';
import { UpdateOcrFieldDto } from './dto/update-ocr-field.dto';
import { convertPdfFirstPageToPng } from './pdf-to-image';

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL ?? 'http://ocr-service:8000';

@Injectable()
export class ScoreSheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchesService: MatchesService,
    private readonly mediaService: MediaService,
  ) {}

  async upload(matchId: string, file: Express.Multer.File, requester: SafeUser) {
    await this.matchesService.assertCanScore(matchId, requester);

    const existing = await this.prisma.scoreSheet.findUnique({ where: { matchId } });
    if (existing?.status === 'VALIDATED') {
      throw new ConflictException('This match already has a validated score sheet');
    }

    // A PDF page isn't an image the OCR service can read — normalize
    // to PNG once here, so everything downstream (storage, OCR,
    // reprocessing, the frontend's <img> preview) only ever deals with
    // an image, regardless of what was actually uploaded.
    const imageFile: Express.Multer.File =
      file.mimetype === 'application/pdf'
        ? {
            ...file,
            buffer: await convertPdfFirstPageToPng(file.buffer),
            mimetype: 'image/png',
            originalname: file.originalname.replace(/\.pdf$/i, '') + '.png',
          }
        : file;

    const imageUrl = await this.mediaService.upload('score-sheet', imageFile);
    const scoreSheet = existing
      ? await this.prisma.scoreSheet.update({
          where: { matchId },
          data: { imageUrl, uploadedById: requester.id, status: 'PROCESSING', uploadedAt: new Date() },
        })
      : await this.prisma.scoreSheet.create({
          data: { matchId, imageUrl, uploadedById: requester.id, status: 'PROCESSING' },
        });

    await this.prisma.oCRProcessingResult.deleteMany({ where: { scoreSheetId: scoreSheet.id } });
    return this.runOcr(scoreSheet.id, matchId, imageFile.buffer);
  }

  async reprocess(scoreSheetId: string, requester: SafeUser) {
    const scoreSheet = await this.getOrThrow(scoreSheetId);
    await this.matchesService.assertCanScore(scoreSheet.matchId, requester);
    // The stored imageUrl is always an already-converted image (see
    // upload() above), so re-fetching it needs no PDF handling — just
    // read the bytes back from MinIO directly (not via its public URL —
    // see downloadByUrl's own comment for why).
    const buffer = await this.mediaService.downloadByUrl(scoreSheet.imageUrl);
    await this.prisma.oCRProcessingResult.deleteMany({ where: { scoreSheetId } });
    return this.runOcr(scoreSheetId, scoreSheet.matchId, buffer);
  }

  async getForMatch(matchId: string, requester: SafeUser) {
    await this.matchesService.assertCanScore(matchId, requester);
    const scoreSheet = await this.prisma.scoreSheet.findUnique({
      where: { matchId },
      include: { processingResult: { include: { fields: { include: { matchedPlayer: true } } } } },
    });
    if (!scoreSheet) {
      throw new NotFoundException('No score sheet uploaded for this match yet');
    }
    return scoreSheet;
  }

  async updateField(fieldId: string, dto: UpdateOcrFieldDto, requester: SafeUser) {
    const field = await this.prisma.oCRFieldResult.findUnique({
      where: { id: fieldId },
      include: { ocrProcessingResult: { include: { scoreSheet: true } } },
    });
    if (!field) {
      throw new NotFoundException('Field not found');
    }
    await this.matchesService.assertCanScore(field.ocrProcessingResult.scoreSheet.matchId, requester);

    return this.prisma.oCRFieldResult.update({
      where: { id: fieldId },
      data: { ...dto, wasManuallyCorrected: true },
    });
  }

  // The human-in-the-loop checkpoint (spec: "OCR results must never be
  // automatically considered official data"). Deliberately does NOT
  // synthesize MatchEvents or overwrite Match.homeScore/awayScore from
  // OCR output — the service only extracts roster matches and a couple
  // of ROI score fields today (see ocr-service's Tier 1/2/3 scope), not
  // a full play-by-play, so there isn't enough here to safely author
  // events. Validating just locks the reviewed fields as the record of
  // what was confirmed.
  async validate(scoreSheetId: string, requester: SafeUser) {
    const scoreSheet = await this.getOrThrow(scoreSheetId);
    await this.matchesService.assertCanScore(scoreSheet.matchId, requester);
    return this.prisma.scoreSheet.update({ where: { id: scoreSheetId }, data: { status: 'VALIDATED' } });
  }

  async reject(scoreSheetId: string, requester: SafeUser) {
    const scoreSheet = await this.getOrThrow(scoreSheetId);
    await this.matchesService.assertCanScore(scoreSheet.matchId, requester);
    return this.prisma.scoreSheet.update({ where: { id: scoreSheetId }, data: { status: 'REJECTED' } });
  }

  private async runOcr(scoreSheetId: string, matchId: string, imageBuffer: Buffer) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        homeTeam: { include: { players: true } },
        awayTeam: { include: { players: true } },
      },
    });

    const toRoster = (team: typeof match.homeTeam) => ({
      id: team.id,
      name: team.name,
      players: team.players.map((p) => ({ id: p.id, name: p.name, jerseyNumber: p.jerseyNumber })),
    });

    const form = new FormData();
    form.append('image', new Blob([new Uint8Array(imageBuffer)]), 'score-sheet.jpg');
    form.append('home_team', JSON.stringify(toRoster(match.homeTeam)));
    form.append('away_team', JSON.stringify(toRoster(match.awayTeam)));

    let ocrResponse: any;
    try {
      const res = await fetch(`${OCR_SERVICE_URL}/process-score-sheet`, { method: 'POST', body: form });
      ocrResponse = await res.json();
    } catch {
      await this.prisma.scoreSheet.update({ where: { id: scoreSheetId }, data: { status: 'PENDING' } });
      throw new BadGatewayException('Could not reach the OCR service — try again shortly');
    }

    if (!ocrResponse.success) {
      await this.prisma.scoreSheet.update({ where: { id: scoreSheetId }, data: { status: 'PENDING' } });
      return {
        success: false,
        reason: ocrResponse.qualityCheck?.reason ?? ocrResponse.error ?? 'OCR processing failed',
      };
    }

    const rosterMatches: any[] = ocrResponse.rosterMatches ?? [];
    const roiExtraction: Record<string, { text: string | null; confidence: number }> =
      ocrResponse.roiExtraction ?? {};
    const confidences = [
      ...rosterMatches.map((m) => m.confidence),
      ...Object.values(roiExtraction).map((f) => f.confidence),
    ];
    const overallConfidence = confidences.length
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    await this.prisma.$transaction(async (tx) => {
      const processingResult = await tx.oCRProcessingResult.create({
        data: { scoreSheetId, rawResponse: ocrResponse, overallConfidence },
      });

      const fieldRows = [
        ...rosterMatches.map((m, index) => ({
          ocrProcessingResultId: processingResult.id,
          fieldName: `roster_row_${index}`,
          rawText: [m.rawJerseyText, m.rawNameText].filter(Boolean).join(' ') || null,
          confidence: m.confidence,
          resolutionMethod: m.resolutionMethod,
          matchedPlayerId: m.matchedPlayerId ?? null,
        })),
        ...Object.entries(roiExtraction).map(([fieldName, value]) => ({
          ocrProcessingResultId: processingResult.id,
          fieldName,
          rawText: value.text,
          confidence: value.confidence,
          resolutionMethod: 'NEEDS_REVIEW' as const,
          matchedPlayerId: null,
        })),
      ];
      if (fieldRows.length) {
        await tx.oCRFieldResult.createMany({ data: fieldRows });
      }

      await tx.scoreSheet.update({ where: { id: scoreSheetId }, data: { status: 'PROCESSED' } });
    });

    return this.getOrThrow(scoreSheetId);
  }

  private async getOrThrow(id: string) {
    const scoreSheet = await this.prisma.scoreSheet.findUnique({
      where: { id },
      include: { processingResult: { include: { fields: true } } },
    });
    if (!scoreSheet) {
      throw new NotFoundException('Score sheet not found');
    }
    return scoreSheet;
  }
}
