import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Client } from 'minio';

const BUCKET = process.env.MINIO_BUCKET ?? 'hoopsync-media';
// The URL browsers use to actually fetch objects — different from the
// internal endpoint the backend connects to MinIO on (a Docker service
// name in compose, only reachable inside the network).
const PUBLIC_URL = (process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000').replace(/\/$/, '');

// Folder per media kind, so unrelated uploads don't share a prefix.
export const MEDIA_FOLDERS = {
  'team-logo': 'team-logos',
  'coach-photo': 'coach-photos',
  'player-photo': 'player-photos',
  'score-sheet': 'score-sheets',
} as const;

export type MediaKind = keyof typeof MEDIA_FOLDERS;

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'minio',
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY ?? 'hoopsync',
      secretKey: process.env.MINIO_SECRET_KEY ?? 'hoopsync123',
    });
  }

  // Photos are optional, cosmetic profile media — never load-bearing
  // for the tournament data itself — so a MinIO outage at boot must
  // never crash the API. Log and let uploads fail individually instead.
  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists(BUCKET);
      if (!exists) {
        await this.client.makeBucket(BUCKET);
      }
      // Team logos, coach photos and player photos are meant to be
      // viewed directly (<img src>) — public read, no write.
      await this.client.setBucketPolicy(
        BUCKET,
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${BUCKET}/*`],
            },
          ],
        }),
      );
    } catch (error) {
      this.logger.warn(`Could not prepare MinIO bucket "${BUCKET}" — media uploads will fail: ${error}`);
    }
  }

  async upload(kind: MediaKind, file: Express.Multer.File): Promise<string> {
    const folder = MEDIA_FOLDERS[kind];
    const key = `${folder}/${randomUUID()}${extname(file.originalname) || ''}`;
    await this.client.putObject(BUCKET, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return `${PUBLIC_URL}/${BUCKET}/${key}`;
  }

  // Reads an object back by the public URL upload() returned — via the
  // MinIO client's own connection (MINIO_ENDPOINT), never by fetching
  // PUBLIC_URL server-side. PUBLIC_URL is for browsers; in local dev
  // it's literally "localhost", which inside this container resolves
  // to the backend itself, not MinIO, and even where it does resolve
  // (a real deployment) it's a needless round-trip through the public
  // internet for a same-network read.
  async downloadByUrl(url: string): Promise<Buffer> {
    const prefix = `${PUBLIC_URL}/${BUCKET}/`;
    if (!url.startsWith(prefix)) {
      throw new Error(`Not a recognized MinIO object URL: ${url}`);
    }
    const key = url.slice(prefix.length);
    const stream = await this.client.getObject(BUCKET, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}
