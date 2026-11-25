import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from './settings.service.js';
import { SettingsRepository } from './settings.repository.js';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: SettingsRepository;

  const mockSettings = {
    id: 'settings-1',
    storeName: 'Zeru Printing Service',
    depositPercentage: 33.33,
    minOrderQuantity: 1,
    standardLeadDays: 3,
    rushLeadDays: 1,
    rushFeePercentage: 20.0,
    contactPhone: '09798765432',
    contactViber: '09798765432',
    contactTelegram: 'zeru_printing',
    telegramBotToken: 'token123',
    telegramAdminChatId: 'chat123',
    googleDriveParentFolderId: 'folder123',
    maintenanceMode: false,
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      getSettings: vi.fn().mockResolvedValue(mockSettings),
      updateSettings: vi.fn(),
    } as unknown as SettingsRepository;

    service = new SettingsService(repository);
  });

  it('getPublicPaymentInfo should return public business settings without exposing secret tokens', async () => {
    const res = await service.getPublicPaymentInfo();
    expect(res.success).toBe(true);
    expect(res.data.storeName).toBe('Zeru Printing Service');
    expect(res.data.depositPercentage).toBe(33.33);
    expect(res.data.standardLeadDays).toBe(3);
    // Secrets should not be present
    expect((res.data as any).telegramBotToken).toBeUndefined();
    expect((res.data as any).googleDriveParentFolderId).toBeUndefined();
  });

  it('getAdminSettings should return complete settings', async () => {
    const res = await service.getAdminSettings();
    expect(res.success).toBe(true);
    expect(res.data.id).toBe('settings-1');
    expect(res.data.telegramBotToken).toBe('token123');
  });

  it('updateSettings should update store configuration', async () => {
    vi.spyOn(repository, 'updateSettings').mockResolvedValue({
      ...mockSettings,
      depositPercentage: 40.0,
      standardLeadDays: 4,
    });

    const res = await service.updateSettings({ depositPercentage: 40.0, standardLeadDays: 4 });
    expect(res.success).toBe(true);
    expect(res.data.depositPercentage).toBe(40.0);
    expect(res.data.standardLeadDays).toBe(4);
  });
});
