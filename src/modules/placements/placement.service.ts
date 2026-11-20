import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '../../common/http/api-response.js';
import type { CreatePlacementDto, UpdatePlacementDto } from './dto/placement.dto.js';
import { PlacementRepository } from './placement.repository.js';

@Injectable()
export class PlacementService {
  constructor(private readonly repository: PlacementRepository) {}

  async listActive() {
    const placements = await this.repository.listActive();
    return ApiResponse.success(placements, 'Print placements retrieved successfully.');
  }

  async listAll() {
    const placements = await this.repository.listAll();
    return ApiResponse.success(placements, 'All print placements retrieved.');
  }

  async findById(id: string) {
    const placement = await this.repository.findById(id);
    if (!placement) {
      throw new NotFoundException(`Placement with ID '${id}' not found`);
    }
    return ApiResponse.success(placement);
  }

  async create(dto: CreatePlacementDto) {
    const existing = await this.repository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Placement with code '${dto.code}' already exists`);
    }

    const created = await this.repository.create(dto);
    return ApiResponse.created(created, 'Placement created successfully.');
  }

  async update(id: string, dto: UpdatePlacementDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Placement with ID '${id}' not found`);
    }

    const updated = await this.repository.update(id, dto);
    return ApiResponse.success(updated, 'Placement updated successfully.');
  }
}
