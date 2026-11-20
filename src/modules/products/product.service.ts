import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiResponse } from '../../common/http/api-response.js';
import { buildPaginationMeta } from '../../shared/pagination/pagination.utils.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
import { ProductRepository } from './product.repository.js';

@Injectable()
export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async listActive(filters?: { gsm?: number; sizingType?: 'SIZED' | 'FREE_SIZE' }) {
    const products = await this.repository.listActive(filters);
    return ApiResponse.success(products, 'Active products retrieved successfully.');
  }

  async listAdmin(params: { page: number; limit: number; search?: string; isActive?: boolean }) {
    const data = await this.repository.listAdmin(params);
    const meta = buildPaginationMeta(data.total, data.page, data.limit, data.items.length);
    return ApiResponse.withPagination(data.items, meta, 'Products retrieved successfully.');
  }

  async findById(id: string) {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
    return ApiResponse.success(product);
  }

  async findBySlug(slug: string) {
    const product = await this.repository.findBySlug(slug);
    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }
    return ApiResponse.success(product);
  }

  async create(dto: CreateProductDto) {
    const existing = await this.repository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Product with slug '${dto.slug}' already exists`);
    }

    const created = await this.repository.create(dto);
    return ApiResponse.created(created, 'Product created successfully.');
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    const updated = await this.repository.update(id, dto);
    return ApiResponse.success(updated, 'Product updated successfully.');
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    await this.repository.delete(id);
    return ApiResponse.success(null, 'Product deleted successfully.');
  }

  async toggleStatus(id: string, isActive: boolean) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    const updated = await this.repository.toggleStatus(id, isActive);
    return ApiResponse.success(updated, `Product status updated to ${isActive ? 'active' : 'inactive'}.`);
  }
}
