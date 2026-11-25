import { Injectable } from '@nestjs/common';
import type { StoreSystemSettings } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { UpdateSettingsDto } from './dto/settings.dto.js';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<StoreSystemSettings> {
    const existing = await this.prisma.storeSystemSettings.findFirst();
    if (existing) {
      return existing;
    }

    // Default settings
    return this.prisma.storeSystemSettings.create({
      data: {
        storeName: 'Zeru Printing Service',
        depositPercentage: 33.33,
        minOrderQuantity: 1,
        standardLeadDays: 3,
        rushLeadDays: 1,
        rushFeePercentage: 20.0,
        contactPhone: '09798765432',
        contactViber: '09798765432',
        contactTelegram: 'zeru_printing',
        maintenanceMode: false,
      },
    });
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<StoreSystemSettings> {
    const settings = await this.getSettings();
    return this.prisma.storeSystemSettings.update({
      where: { id: settings.id },
      data: {
        ...(dto.storeName !== undefined ? { storeName: dto.storeName } : {}),
        ...(dto.depositPercentage !== undefined ? { depositPercentage: dto.depositPercentage } : {}),
        ...(dto.minOrderQuantity !== undefined ? { minOrderQuantity: dto.minOrderQuantity } : {}),
        ...(dto.standardLeadDays !== undefined ? { standardLeadDays: dto.standardLeadDays } : {}),
        ...(dto.rushLeadDays !== undefined ? { rushLeadDays: dto.rushLeadDays } : {}),
        ...(dto.rushFeePercentage !== undefined ? { rushFeePercentage: dto.rushFeePercentage } : {}),
        ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone } : {}),
        ...(dto.contactViber !== undefined ? { contactViber: dto.contactViber } : {}),
        ...(dto.contactTelegram !== undefined ? { contactTelegram: dto.contactTelegram } : {}),
        ...(dto.telegramBotToken !== undefined ? { telegramBotToken: dto.telegramBotToken } : {}),
        ...(dto.telegramAdminChatId !== undefined ? { telegramAdminChatId: dto.telegramAdminChatId } : {}),
        ...(dto.googleDriveParentFolderId !== undefined ? { googleDriveParentFolderId: dto.googleDriveParentFolderId } : {}),
        ...(dto.maintenanceMode !== undefined ? { maintenanceMode: dto.maintenanceMode } : {}),
      },
    });
  }
}
