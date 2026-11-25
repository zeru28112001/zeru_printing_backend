import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '../../common/http/api-response.js';
import type { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto.js';
import { PaymentMethodsRepository } from './payment-methods.repository.js';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly repository: PaymentMethodsRepository) {}

  async getPublicMethods() {
    const list = await this.repository.listActive();
    return ApiResponse.success(list);
  }

  async getAllMethods() {
    const list = await this.repository.listAll();
    return ApiResponse.success(list);
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException('Payment method not found');
    }
    return ApiResponse.success(item);
  }

  async create(dto: CreatePaymentMethodDto) {
    const existing = await this.repository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Payment method with code "${dto.code}" already exists.`);
    }
    const created = await this.repository.create(dto);
    return ApiResponse.created(created, 'Payment method added successfully.');
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    await this.getById(id);
    const updated = await this.repository.update(id, dto);
    return ApiResponse.success(updated, 'Payment method updated successfully.');
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
    return ApiResponse.success(null, 'Payment method deleted successfully.');
  }
}
