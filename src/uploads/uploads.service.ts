import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly s3: S3Client | null;
  private readonly bucket?: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET');
    this.region = this.config.get<string>('S3_REGION') || this.config.get<string>('AWS_REGION') || 'sa-east-1';
    // Usa a cadeia padrão de credenciais (profile ~/.aws localmente, variáveis de ambiente em produção).
    this.s3 = this.bucket ? new S3Client({ region: this.region }) : null;
    if (this.bucket) this.logger.log(`Uploads → S3 bucket "${this.bucket}" (${this.region})`);
    else this.logger.warn('S3_BUCKET não definido — uploads cairão no disco local (uploads/).');
  }

  /** Salva o arquivo (S3 se configurado, senão disco) e devolve a URL absoluta. */
  async save(file: Express.Multer.File): Promise<{ url: string; path: string; key: string }> {
    const unique = Date.now().toString(36) + '-' + Math.round(Math.random() * 1e9).toString(36);
    const key = `uploads/${unique}${extname(file.originalname).toLowerCase()}`;

    if (this.s3 && this.bucket) {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }));
      const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      return { url, path: `/${key}`, key };
    }

    // Fallback: disco local servido em /uploads
    const dir = join(process.cwd(), 'uploads');
    await mkdir(dir, { recursive: true });
    const filename = key.replace('uploads/', '');
    await writeFile(join(dir, filename), file.buffer);
    return { url: `/uploads/${filename}`, path: `/uploads/${filename}`, key };
  }
}
