import { Injectable } from '@nestjs/common';
import type { StoreSettings } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { UpdateSettingsDto } from './dto/settings.dto.js';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<StoreSettings> {
    const existing = await this.prisma.storeSettings.findFirst();
    if (existing) {
      return existing;
    }

    // Default settings
    return this.prisma.storeSettings.create({
      data: {
        depositPercentage: 33.33,
        kbzPayAccountName: 'Zeru Printing Service',
        kbzPayPhone: '09798765432',
        wavePayAccountName: 'Zeru Printing Service',
        wavePayPhone: '09798765432',
        adminContactPhone: '09798765432',
        adminViberPhone: '09798765432',
        adminTelegramUsername: 'zeru_printing',
      },
    });
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<StoreSettings> {
    const settings = await this.getSettings();
    return this.prisma.storeSettings.update({
      where: { id: settings.id },
      data: {
        ...(dto.depositPercentage !== undefined ? { depositPercentage: dto.depositPercentage } : {}),
        ...(dto.kbzPayAccountName !== undefined ? { kbzPayAccountName: dto.kbzPayAccountName } : {}),
        ...(dto.kbzPayPhone !== undefined ? { kbzPayPhone: dto.kbzPayPhone } : {}),
        ...(dto.kbzPayQrUrl !== undefined ? { kbzPayQrUrl: dto.kbzPayQrUrl } : {}),
        ...(dto.wavePayAccountName !== undefined ? { wavePayAccountName: dto.wavePayAccountName } : {}),
        ...(dto.wavePayPhone !== undefined ? { wavePayPhone: dto.wavePayPhone } : {}),
        ...(dto.wavePayQrUrl !== undefined ? { wavePayQrUrl: dto.wavePayQrUrl } : {}),
        ...(dto.adminContactPhone !== undefined ? { adminContactPhone: dto.adminContactPhone } : {}),
        ...(dto.adminViberPhone !== undefined ? { adminViberPhone: dto.adminViberPhone } : {}),
        ...(dto.adminTelegramUsername !== undefined ? { adminTelegramUsername: dto.adminTelegramUsername } : {}),
        ...(dto.telegramBotToken !== undefined ? { telegramBotToken: dto.telegramBotToken } : {}),
        ...(dto.telegramChatId !== undefined ? { telegramChatId: dto.telegramChatId } : {}),
        ...(dto.googleDriveFolderId !== undefined ? { googleDriveFolderId: dto.googleDriveFolderId } : {}),
      },
    });
  }
}
