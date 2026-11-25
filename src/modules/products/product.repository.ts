import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { getPagination } from '../../shared/pagination/pagination.utils.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';

function formatProduct(p: any) {
  if (!p) return null;

  const colorsMap = new Map();
  const sizesSet = new Set<string>();

  if (p.variants && p.variants.length > 0) {
    for (const v of p.variants) {
      if (!colorsMap.has(v.colorName)) {
        colorsMap.set(v.colorName, {
          name: v.colorName,
          hex: v.colorHex,
          frontImage: v.frontBlankImage,
          backImage: v.backBlankImage,
          inStock: (v.stock?.quantityOnHand ?? 1) > 0,
        });
      }
      sizesSet.add(v.size);
    }
  }

  const colors =
    colorsMap.size > 0
      ? Array.from(colorsMap.values())
      : [
          { name: 'Pure White', hex: '#FFFFFF', inStock: true },
          { name: 'Pitch Black', hex: '#111111', inStock: true },
        ];

  const availableSizes =
    sizesSet.size > 0
      ? Array.from(sizesSet)
      : p.sizeChart?.map((s: any) => s.size) || ['S', 'M', 'L', 'XL', '2XL'];

  const price =
    p.basePriceMmk !== undefined && p.basePriceMmk !== null
      ? p.basePriceMmk
      : p.basePrice || 18000;

  return {
    ...p,
    gsm: p.gsm || 240,
    fabricType: p.fabricType || '100% Combed Cotton',
    basePrice: price,
    basePriceMmk: price,
    colors,
    availableSizes,
  };
}

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(filters?: { gsm?: number; sizingType?: 'SIZED' | 'FREE_SIZE' }) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
        ...(filters?.gsm ? { gsm: filters.gsm } : {}),
        ...(filters?.sizingType ? { sizingType: filters.sizingType } : {}),
      },
      include: {
        variants: {
          where: { isActive: true },
          include: { stock: true },
        },
      },
      orderBy: [{ gsm: 'asc' }, { name: 'asc' }],
    });

    return products.map(formatProduct);
  }

  async listAdmin(params: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip, take, page: p, limit: l } = getPagination(params.page, params.limit);

    const andConditions: Prisma.ProductWhereInput[] = [
      { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    ];

    if (params.isActive !== undefined) {
      andConditions.push({ isActive: params.isActive });
    }

    if (params.search?.trim()) {
      andConditions.push({
        OR: [
          { name: { contains: params.search.trim(), mode: 'insensitive' } },
          { fabricType: { contains: params.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ProductWhereInput = { AND: andConditions };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          variants: {
            include: { stock: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map(formatProduct), total, page: p, limit: l };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      include: {
        variants: {
          include: { stock: true },
        },
      },
    });

    return formatProduct(product);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug: slug.toLowerCase(),
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      include: {
        variants: {
          include: { stock: true },
        },
      },
    });

    return formatProduct(product);
  }

  async create(dto: CreateProductDto) {
    const price =
      dto.basePriceMmk !== undefined
        ? dto.basePriceMmk
        : (dto as any).basePrice || 18000;

    const sizeChart = (dto.sizeChart || []).map((s) => ({
      size: s.size,
      shoulder: Number(s.shoulder) || 0,
      chest: Number(s.chest) || 0,
      length: Number(s.length) || 0,
      sleeve: Number(s.sleeve) || 0,
      neckWidth: Number(s.neckWidth) || 0,
    }));

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase().trim(),
        description: dto.description,
        gsm: dto.gsm,
        fabricType: dto.fabricType,
        basePriceMmk: price,
        sizingType: dto.sizingType || 'SIZED',
        isCustomizable: dto.isCustomizable !== undefined ? dto.isCustomizable : true,
        isReadyToWear: dto.isReadyToWear !== undefined ? dto.isReadyToWear : false,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sizeChart,
        featuredImage: dto.featuredImage,
      },
    });

    // Automatically generate variants and stock for every color and size!
    const colors =
      dto.colors && dto.colors.length > 0
        ? dto.colors
        : [
            { name: 'Pure White', hex: '#FFFFFF', inStock: true },
            { name: 'Pitch Black', hex: '#111111', inStock: true },
          ];

    const sizes =
      dto.availableSizes && dto.availableSizes.length > 0
        ? dto.availableSizes
        : dto.sizeChart && dto.sizeChart.length > 0
          ? dto.sizeChart.map((s) => s.size)
          : dto.sizingType === 'FREE_SIZE'
            ? ['Free Size']
            : ['S', 'M', 'L', 'XL', '2XL'];

    for (const c of colors) {
      for (const s of sizes) {
        const colorCode = c.name.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sku = `ZP-${dto.gsm}-${colorCode}-${s.replace(/\s+/g, '')}`.toUpperCase();

        const variant = await this.prisma.productVariant.create({
          data: {
            productId: product.id,
            sku,
            colorName: c.name,
            colorHex: c.hex,
            size: s,
            frontBlankImage: c.frontImage,
            backBlankImage: c.backImage,
            additionalCostMmk: 0,
          },
        });

        await this.prisma.inventoryStock.create({
          data: {
            variantId: variant.id,
            quantityOnHand: 50, // default stock on creation
            quantityReserved: 0,
            safetyStockThreshold: 10,
          },
        });
      }
    }

    return this.findById(product.id);
  }

  async update(id: string, dto: UpdateProductDto) {
    const price =
      dto.basePriceMmk !== undefined ? dto.basePriceMmk : (dto as any).basePrice;
    const slug = (dto as any).slug;

    const formattedSizeChart = dto.sizeChart
      ? dto.sizeChart.map((s) => ({
          size: s.size,
          shoulder: Number(s.shoulder) || 0,
          chest: Number(s.chest) || 0,
          length: Number(s.length) || 0,
          sleeve: Number(s.sleeve) || 0,
          neckWidth: Number(s.neckWidth) || 0,
        }))
      : undefined;

    await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(slug ? { slug: slug.toLowerCase().trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.gsm ? { gsm: dto.gsm } : {}),
        ...(dto.fabricType ? { fabricType: dto.fabricType } : {}),
        ...(price !== undefined ? { basePriceMmk: price } : {}),
        ...(dto.sizingType ? { sizingType: dto.sizingType } : {}),
        ...(dto.isCustomizable !== undefined ? { isCustomizable: dto.isCustomizable } : {}),
        ...(dto.isReadyToWear !== undefined ? { isReadyToWear: dto.isReadyToWear } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(formattedSizeChart ? { sizeChart: formattedSizeChart } : {}),
        ...(dto.featuredImage !== undefined ? { featuredImage: dto.featuredImage } : {}),
      },
    });

    // If new colors or sizes were added during edit, create missing variants
    if (dto.colors && dto.colors.length > 0) {
      const existingVariants = await this.prisma.productVariant.findMany({
        where: { productId: id },
      });

      const sizes =
        dto.availableSizes ||
        dto.sizeChart?.map((s) => s.size) ||
        (existingVariants.length > 0 ? Array.from(new Set(existingVariants.map((v) => v.size))) : ['M']);

      for (const c of dto.colors) {
        for (const s of sizes) {
          const exists = existingVariants.some(
            (v) => v.colorName.toLowerCase() === c.name.toLowerCase() && v.size === s,
          );
          if (!exists) {
            const colorCode = c.name.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const sku = `ZP-${dto.gsm || 240}-${colorCode}-${s.replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`.toUpperCase();

            const v = await this.prisma.productVariant.create({
              data: {
                productId: id,
                sku,
                colorName: c.name,
                colorHex: c.hex,
                size: s,
                frontBlankImage: c.frontImage,
                backBlankImage: c.backImage,
                additionalCostMmk: 0,
              },
            });

            await this.prisma.inventoryStock.create({
              data: {
                variantId: v.id,
                quantityOnHand: 50,
                quantityReserved: 0,
                safetyStockThreshold: 10,
              },
            });
          }
        }
      }
    }

    return this.findById(id);
  }

  async softDelete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async delete(id: string) {
    return this.softDelete(id);
  }

  async toggleStatus(id: string, isActive: boolean) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive },
    });
  }
}
