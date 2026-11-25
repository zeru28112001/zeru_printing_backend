import { Injectable } from '@nestjs/common';
import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { getPagination } from '../../shared/pagination/pagination.utils.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: {
        customer: true,
        shippingAddress: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
            customizations: {
              include: {
                placement: true,
                artworkAsset: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        shippingAddress: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
            customizations: {
              include: {
                placement: true,
                artworkAsset: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
        shipments: true,
        auditLogs: true,
      },
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        shippingAddress: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
            customizations: {
              include: {
                placement: true,
                artworkAsset: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
        shipments: true,
      },
    });
  }

  async trackOrder(orderNumber: string, phone: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { phone },
    });

    if (!customer) {
      return null;
    }

    return this.prisma.order.findFirst({
      where: {
        orderNumber,
        customerId: customer.id,
      },
      include: {
        customer: true,
        shippingAddress: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
            customizations: {
              include: {
                placement: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
        shipments: true,
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
        include: {
          customer: true,
          shippingAddress: true,
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
              customizations: {
                include: {
                  placement: true,
                },
              },
            },
          },
          payments: {
            include: {
              paymentMethod: true,
            },
          },
        },
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
  ) {
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(data?.depositPaidMmk !== undefined ? { depositPaidMmk: data.depositPaidMmk } : {}),
        ...(data?.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
      },
      include: {
        customer: true,
        shippingAddress: true,
        items: {
          include: {
            variant: true,
            customizations: true,
          },
        },
        payments: true,
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
