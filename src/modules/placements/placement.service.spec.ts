import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlacementService } from './placement.service.js';
import { PlacementRepository } from './placement.repository.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PlacementSide } from '@prisma/client';

describe('PlacementService', () => {
  let service: PlacementService;
  let repository: PlacementRepository;

  const samplePlacement = {
    id: 'pl-1',
    code: 'full_front',
    name: 'Full Front',
    side: PlacementSide.FRONT,
    isDefaultShown: true,
    maxWidthInches: 12.0,
    maxHeightInches: 14.0,
    baseCostMmk: 7000,
    isActive: true,
    sortOrder: 1,
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
    } as unknown as PlacementRepository;

    service = new PlacementService(repository);
  });

  it('listActive should return active placements', async () => {
    vi.spyOn(repository, 'listActive').mockResolvedValue([samplePlacement]);
    const res = await service.listActive();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].code).toBe('full_front');
  });

  it('create should throw ConflictException if placement code already exists', async () => {
    vi.spyOn(repository, 'findByCode').mockResolvedValue(samplePlacement);
    await expect(
      service.create({
        code: 'full_front',
        name: 'Full Front',
        side: 'FRONT',
        defaultWidthInches: 12.0,
        defaultHeightInches: 14.0,
        baseCostMmk: 7000,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('create should create placement successfully', async () => {
    vi.spyOn(repository, 'findByCode').mockResolvedValue(null);
    vi.spyOn(repository, 'create').mockResolvedValue(samplePlacement);

    const res = await service.create({
      code: 'full_front',
      name: 'Full Front',
      side: 'FRONT',
      defaultWidthInches: 12.0,
      defaultHeightInches: 14.0,
      baseCostMmk: 7000,
    });

    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('pl-1');
  });

  it('update should update placement details', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(samplePlacement);
    vi.spyOn(repository, 'update').mockResolvedValue({
      ...samplePlacement,
      baseCostMmk: 8000,
    });

    const res = await service.update('pl-1', { baseCostMmk: 8000 });
    expect(res.success).toBe(true);
    expect(res.data.baseCostMmk).toBe(8000);
  });
});
