import { Injectable } from '@nestjs/common';
import { ApiResponse } from '../../common/http/api-response.js';
import type { UpdateSettingsDto } from './dto/settings.dto.js';
import { SettingsRepository } from './settings.repository.js';

@Injectable()
export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async getPublicPaymentInfo() {
    const s = await this.repository.getSettings();
    return ApiResponse.success({
      depositPercentage: s.depositPercentage,
      kbzPayAccountName: s.kbzPayAccountName,
      kbzPayPhone: s.kbzPayPhone,
      kbzPayQrUrl: s.kbzPayQrUrl,
      wavePayAccountName: s.wavePayAccountName,
      wavePayPhone: s.wavePayPhone,
      wavePayQrUrl: s.wavePayQrUrl,
      adminContactPhone: s.adminContactPhone,
      adminViberPhone: s.adminViberPhone,
      adminTelegramUsername: s.adminTelegramUsername,
    });
  }

  async getAdminSettings() {
    const s = await this.repository.getSettings();
    return ApiResponse.success(s);
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const updated = await this.repository.updateSettings(dto);
    return ApiResponse.success(updated, 'Store settings updated successfully.');
  }
}
