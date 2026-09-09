import { BadRequestException } from '@nestjs/common';
import { execFile } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Renders a PDF's first page to a PNG via poppler's pdftoppm — the OCR
// service only reads images, so a PDF score sheet needs converting
// before it can go through the same pipeline as a photo.
export async function convertPdfFirstPageToPng(pdfBuffer: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'hoopsync-pdf-'));
  const inputPath = join(dir, 'input.pdf');
  const outputPrefix = join(dir, 'page');
  try {
    await writeFile(inputPath, pdfBuffer);
    await execFileAsync('pdftoppm', ['-png', '-r', '200', '-f', '1', '-l', '1', inputPath, outputPrefix]);
    return await readFile(`${outputPrefix}-1.png`);
  } catch {
    throw new BadRequestException('Could not read that PDF — try a clearer scan or an image instead');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
