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
      storeName: s.storeName,
      depositPercentage: s.depositPercentage,
      standardLeadDays: s.standardLeadDays,
      rushLeadDays: s.rushLeadDays,
      rushFeePercentage: s.rushFeePercentage,
      contactPhone: s.contactPhone,
      contactViber: s.contactViber,
      contactTelegram: s.contactTelegram,
      maintenanceMode: s.maintenanceMode,
    });
  }

  async getAdminSettings() {
    const s = await this.repository.getSettings();
    return ApiResponse.success(s);
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const updated = await this.repository.updateSettings(dto);
    return ApiResponse.success(updated, 'Store system settings updated successfully.');
  }
}
