import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from './product.service.js';
import { ProductRepository } from './product.repository.js';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SizingType } from '@prisma/client';

describe('ProductService', () => {
  let service: ProductService;
  let repository: ProductRepository;

  const sampleProduct = {
    id: 'prod-1',
    name: 'Heavyweight Premium Cotton Tee',
    slug: 'heavyweight-premium-cotton-tee-240gsm',
    description: '240 GSM heavy cotton',
    gsm: 240,
    fabricType: '100% Combed Cotton',
    basePriceMmk: 18000,
    basePrice: 18000,
    sizingType: SizingType.SIZED,
    isCustomizable: true,
    isReadyToWear: false,
    isActive: true,
    featuredImage: null,
    sizeChart: [],
    colors: [
      { name: 'Pure White', hex: '#FFFFFF', inStock: true },
      { name: 'Pitch Black', hex: '#111111', inStock: true },
    ],
    availableSizes: ['S', 'M', 'L', 'XL', '2XL'],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    repository = {
      listActive: vi.fn(),
      listAdmin: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      toggleStatus: vi.fn(),
    } as unknown as ProductRepository;

    service = new ProductService(repository);
  });

  it('listActive should return active products', async () => {
    vi.spyOn(repository, 'listActive').mockResolvedValue([sampleProduct as any]);
    const res = await service.listActive();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].slug).toBe('heavyweight-premium-cotton-tee-240gsm');
  });

  it('findBySlug should return product if found', async () => {
    vi.spyOn(repository, 'findBySlug').mockResolvedValue(sampleProduct as any);
    const res = await service.findBySlug('heavyweight-premium-cotton-tee-240gsm');
    expect(res.success).toBe(true);
    expect(res.data.id).toBe('prod-1');
  });

  it('findBySlug should throw NotFoundException if product does not exist', async () => {
    vi.spyOn(repository, 'findBySlug').mockResolvedValue(null);
    await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(NotFoundException);
  });

  it('create should throw ConflictException if slug already exists', async () => {
    vi.spyOn(repository, 'findBySlug').mockResolvedValue(sampleProduct as any);
    await expect(
      service.create({
        name: 'Heavyweight Tee',
        slug: 'heavyweight-premium-cotton-tee-240gsm',
        gsm: 240,
        fabricType: 'Cotton',
        basePrice: 18000,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('create should create product successfully', async () => {
    vi.spyOn(repository, 'findBySlug').mockResolvedValue(null);
    vi.spyOn(repository, 'create').mockResolvedValue(sampleProduct as any);

    const res = await service.create({
      name: 'Heavyweight Tee',
      slug: 'new-heavyweight-tee',
      gsm: 240,
      fabricType: 'Cotton',
      basePrice: 18000,
    });

    expect(res.success).toBe(true);
    expect(res.data.id).toBe('prod-1');
  });

  it('update should update product', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(sampleProduct as any);
    vi.spyOn(repository, 'update').mockResolvedValue({
      ...sampleProduct,
      name: 'Updated Name',
    } as any);

    const res = await service.update('prod-1', { name: 'Updated Name' });
    expect(res.success).toBe(true);
    expect(res.data.name).toBe('Updated Name');
  });

  it('toggleStatus should toggle active state', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(sampleProduct as any);
    vi.spyOn(repository, 'toggleStatus').mockResolvedValue({
      ...sampleProduct,
      isActive: false,
    } as any);

    const res = await service.toggleStatus('prod-1', false);
    expect(res.success).toBe(true);
    expect(res.data.isActive).toBe(false);
  });

  it('delete should soft delete product', async () => {
    vi.spyOn(repository, 'findById').mockResolvedValue(sampleProduct as any);
    vi.spyOn(repository, 'delete').mockResolvedValue(sampleProduct as any);

    const res = await service.delete('prod-1');
    expect(res.success).toBe(true);
    expect(repository.delete).toHaveBeenCalledWith('prod-1');
  });
});
