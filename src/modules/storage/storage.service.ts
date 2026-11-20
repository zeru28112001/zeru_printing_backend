import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import type { EnvConfig } from '../../config/env.schema.js';

export interface UploadResult {
  url: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveDownloadLink?: string;
  storageType: 'google_drive' | 'local';
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private driveClient: ReturnType<typeof google.drive> | null = null;
  private readonly folderId?: string;
  private readonly localUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const clientEmail = this.configService.get('GOOGLE_DRIVE_CLIENT_EMAIL', { infer: true });
    const rawKey = this.configService.get('GOOGLE_DRIVE_PRIVATE_KEY', { infer: true });
    this.folderId = this.configService.get('GOOGLE_DRIVE_FOLDER_ID', { infer: true });

    if (clientEmail && rawKey) {
      try {
        const privateKey = rawKey.replace(/\\n/g, '\n');
        const auth = new google.auth.JWT({
          email: clientEmail,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
        this.driveClient = google.drive({ version: 'v3', auth });
        this.logger.log('✅ Google Drive Service Account client initialized');
      } catch (err) {
        this.logger.warn(`⚠️ Failed to initialize Google Drive client: ${err instanceof Error ? err.message : err}`);
      }
    } else {
      this.logger.log('ℹ️ Google Drive credentials not provided. Using local disk storage (/uploads)');
    }

    // Ensure local upload directories exist as fallback
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }
  }

  /**
   * Uploads a file (artwork or payment slip) to Google Drive, or falls back to local storage
   */
  async uploadFile(params: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    subfolder?: 'artworks' | 'slips';
  }): Promise<UploadResult> {
    const { buffer, fileName, mimeType, subfolder = 'artworks' } = params;

    // 1. Try Google Drive if configured
    if (this.driveClient) {
      try {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const response = await this.driveClient.files.create({
          requestBody: {
            name: `${Date.now()}_${fileName}`,
            mimeType,
            parents: this.folderId ? [this.folderId] : undefined,
          },
          media: {
            mimeType,
            body: stream,
          },
          fields: 'id, webViewLink, webContentLink',
        });

        const fileId = response.data.id!;
        
        // Make file publicly readable via link
        try {
          await this.driveClient.permissions.create({
            fileId,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
          });
        } catch (permError) {
          this.logger.warn(`Could not set public permission on Google Drive file: ${permError}`);
        }

        const driveWebViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
        const driveDownloadLink = response.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`;

        this.logger.log(`Uploaded file to Google Drive: ${fileId} (${fileName})`);

        return {
          url: driveDownloadLink,
          driveFileId: fileId,
          driveWebViewLink,
          driveDownloadLink,
          storageType: 'google_drive',
        };
      } catch (error) {
        this.logger.error(`Failed to upload to Google Drive, falling back to local: ${error instanceof Error ? error.message : error}`);
      }
    }

    // 2. Fallback to Local Filesystem
    const targetDir = path.join(this.localUploadDir, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(targetDir, safeFileName);
    await fs.promises.writeFile(filePath, buffer);

    const port = this.configService.get('PORT', { infer: true }) || 4000;
    const localUrl = `http://localhost:${port}/uploads/${subfolder}/${safeFileName}`;

    this.logger.log(`Saved file locally: ${filePath}`);

    return {
      url: localUrl,
      storageType: 'local',
    };
  }
}
