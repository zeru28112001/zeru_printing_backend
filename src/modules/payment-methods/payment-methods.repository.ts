import { Injectable } from '@nestjs/common';
import type { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto.js';

@Injectable()
export class PaymentMethodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async listAll(): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({
      where: { code: code.toLowerCase() },
    });
  }

  async create(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.create({
      data: {
        code: dto.code.toLowerCase().trim(),
        name: dto.name,
        type: dto.type,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        bankBranch: dto.bankBranch,
        qrCodeImageUrl: dto.qrCodeImageUrl,
        qrCodeDriveFileId: dto.qrCodeDriveFileId,
        instructions: dto.instructions,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        displayOrder: dto.displayOrder || 0,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.accountName ? { accountName: dto.accountName } : {}),
        ...(dto.accountNumber ? { accountNumber: dto.accountNumber } : {}),
        ...(dto.bankBranch !== undefined ? { bankBranch: dto.bankBranch } : {}),
        ...(dto.qrCodeImageUrl !== undefined ? { qrCodeImageUrl: dto.qrCodeImageUrl } : {}),
        ...(dto.qrCodeDriveFileId !== undefined ? { qrCodeDriveFileId: dto.qrCodeDriveFileId } : {}),
        ...(dto.instructions !== undefined ? { instructions: dto.instructions } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
      },
    });
  }

  async delete(id: string): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }
}
