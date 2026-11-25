import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentMethodsService } from './payment-methods.service.js';
import { PaymentMethodsRepository } from './payment-methods.repository.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentChannelType } from '@prisma/client';

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
  let repository: PaymentMethodsRepository;

  const sampleMethod = {
    id: 'pm-1',
    code: 'kbzpay_personal',
    name: 'KBZPay (Personal)',
    type: PaymentChannelType.MOBILE_WALLET,
    accountName: 'U Kyaw Zayar Myo',
    accountNumber: '09798765432',
    bankBranch: null,
    qrCodeImageUrl: 'https://example.com/qr.png',
    qrCodeDriveFileId: null,
    instructions: 'Include order number in transfer note',
    isActive: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      listActive: vi.fn(),
      listAll: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as PaymentMethodsRepository;

    service = new PaymentMethodsService(repository);
  });

  it('getPublicMethods should return active payment methods', async () => {
    vi.spyOn(repository, 'listActive').mockResolvedValue([sampleMethod]);
    const res = await service.getPublicMethods();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].code).toBe('kbzpay_personal');
  });

  it('getById should return method if found', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(sampleMethod);
    const res = await service.getById('pm-1');
    expect(res.success).toBe(true);
    expect(res.data.id).toBe('pm-1');
  });

  it('getById should throw NotFoundException if not found', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(null);
    await expect(service.getById('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('create should throw ConflictException if channel code already exists', async () => {
    vi.spyOn(repository, 'findByCode').mockResolvedValue(sampleMethod);
    await expect(
      service.create({
        code: 'kbzpay_personal',
        name: 'KBZPay',
        accountName: 'Admin',
        accountNumber: '09123456789',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('create should successfully add a new payment method', async () => {
    vi.spyOn(repository, 'findByCode').mockResolvedValue(null);
    vi.spyOn(repository, 'create').mockResolvedValue({
      ...sampleMethod,
      id: 'pm-2',
      code: 'wavepay_personal',
      name: 'WavePay',
    });

    const res = await service.create({
      code: 'wavepay_personal',
      name: 'WavePay',
      accountName: 'Daw Thandar',
      accountNumber: '09798765432',
    });

    expect(res.success).toBe(true);
    expect(res.data?.code).toBe('wavepay_personal');
  });

  it('update should update existing payment channel', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(sampleMethod);
    vi.spyOn(repository, 'update').mockResolvedValue({
      ...sampleMethod,
      accountName: 'Updated Name',
    });

    const res = await service.update('pm-1', { accountName: 'Updated Name' });
    expect(res.success).toBe(true);
    expect(res.data.accountName).toBe('Updated Name');
  });

  it('remove should delete payment method', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(sampleMethod);
    vi.spyOn(repository, 'delete').mockResolvedValue(sampleMethod);

    const res = await service.remove('pm-1');
    expect(res.success).toBe(true);
    expect(repository.delete).toHaveBeenCalledWith('pm-1');
  });
});
