import { Injectable } from '@nestjs/common';
import type { Prisma, Product } from '@prisma/client';
import { getPagination } from '../../shared/pagination/pagination.utils.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(filters?: { gsm?: number; sizingType?: 'SIZED' | 'FREE_SIZE' }): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        ...(filters?.gsm ? { gsm: filters.gsm } : {}),
        ...(filters?.sizingType ? { sizingType: filters.sizingType } : {}),
      },
      orderBy: [{ gsm: 'asc' }, { name: 'asc' }],
    });
  }

  async listAdmin(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip, take, page: p, limit: l } = getPagination(params.page, params.limit);

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.search?.trim()
        ? {
            OR: [
              { name: { contains: params.search.trim(), mode: 'insensitive' } },
              { fabricType: { contains: params.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: {
        id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: {
        slug: slug.toLowerCase(),
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });
  }

  async create(dto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase().trim(),
        description: dto.description,
        gsm: dto.gsm,
        fabricType: dto.fabricType,
        basePrice: dto.basePrice,
        sizingType: dto.sizingType || 'SIZED',
        isCustomizable: dto.isCustomizable !== undefined ? dto.isCustomizable : true,
        isReadyToWear: dto.isReadyToWear !== undefined ? dto.isReadyToWear : false,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        colors: dto.colors || [],
        sizeChart: dto.sizeChart || [],
        availableSizes: dto.availableSizes || (dto.sizingType === 'FREE_SIZE' ? ['Free Size'] : ['S', 'M', 'L', 'XL', '2XL']),
        featuredImage: dto.featuredImage,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.gsm !== undefined ? { gsm: dto.gsm } : {}),
        ...(dto.fabricType ? { fabricType: dto.fabricType } : {}),
        ...(dto.basePrice !== undefined ? { basePrice: dto.basePrice } : {}),
        ...(dto.sizingType ? { sizingType: dto.sizingType } : {}),
        ...(dto.isCustomizable !== undefined ? { isCustomizable: dto.isCustomizable } : {}),
        ...(dto.isReadyToWear !== undefined ? { isReadyToWear: dto.isReadyToWear } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.colors ? { colors: dto.colors } : {}),
        ...(dto.sizeChart ? { sizeChart: dto.sizeChart } : {}),
        ...(dto.availableSizes ? { availableSizes: dto.availableSizes } : {}),
        ...(dto.featuredImage !== undefined ? { featuredImage: dto.featuredImage } : {}),
      },
    });
  }

  async delete(id: string): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async toggleStatus(id: string, isActive: boolean): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: { isActive },
    });
  }
}
