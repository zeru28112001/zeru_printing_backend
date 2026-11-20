import { Injectable } from '@nestjs/common';
import type { PrintPlacement } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { CreatePlacementDto, UpdatePlacementDto } from './dto/placement.dto.js';

@Injectable()
export class PlacementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<PrintPlacement[]> {
    return this.prisma.printPlacement.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async listAll(): Promise<PrintPlacement[]> {
    return this.prisma.printPlacement.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string): Promise<PrintPlacement | null> {
    return this.prisma.printPlacement.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<PrintPlacement | null> {
    return this.prisma.printPlacement.findUnique({
      where: { code },
    });
  }

  async create(dto: CreatePlacementDto): Promise<PrintPlacement> {
    return this.prisma.printPlacement.create({
      data: {
        code: dto.code.toLowerCase().trim(),
        name: dto.name,
        side: dto.side,
        isDefaultShown: dto.isDefaultShown || false,
        defaultWidthInches: dto.defaultWidthInches,
        defaultHeightInches: dto.defaultHeightInches,
        baseCostMmk: dto.baseCostMmk,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async update(id: string, dto: UpdatePlacementDto): Promise<PrintPlacement> {
    return this.prisma.printPlacement.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.side ? { side: dto.side } : {}),
        ...(dto.isDefaultShown !== undefined ? { isDefaultShown: dto.isDefaultShown } : {}),
        ...(dto.defaultWidthInches !== undefined ? { defaultWidthInches: dto.defaultWidthInches } : {}),
        ...(dto.defaultHeightInches !== undefined ? { defaultHeightInches: dto.defaultHeightInches } : {}),
        ...(dto.baseCostMmk !== undefined ? { baseCostMmk: dto.baseCostMmk } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }
}
