import { Injectable } from '@nestjs/common';
import type { Order, OrderStatus, OrderType, Prisma } from '@prisma/client';
import { getPagination } from '../../shared/pagination/pagination.utils.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.OrderCreateInput): Promise<Order> {
    return this.prisma.order.create({ data });
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { orderNumber },
    });
  }

  async trackOrder(orderNumber: string, phone: string): Promise<Order | null> {
    return this.prisma.order.findFirst({
      where: {
        orderNumber,
        customer: {
          is: { phone },
        },
      },
    });
  }

  async listPaginated(params: {
    page: number;
    limit: number;
    status?: OrderStatus;
    orderType?: OrderType;
    search?: string;
  }) {
    const { skip, take, page: p, limit: l } = getPagination(params.page, params.limit);

    const where: Prisma.OrderWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.orderType ? { orderType: params.orderType } : {}),
      ...(params.search?.trim()
        ? {
            OR: [
              { orderNumber: { contains: params.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    data?: { depositPaidMmk?: number; adminNotes?: string },
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(data?.depositPaidMmk !== undefined ? { depositPaidMmk: data.depositPaidMmk } : {}),
        ...(data?.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
      },
    });
  }

  async getLatestOrderNumber(): Promise<string | null> {
    const latest = await this.prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    });
    return latest?.orderNumber || null;
  }
}
