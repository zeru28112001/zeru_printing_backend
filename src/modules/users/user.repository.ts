import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { getPagination } from '../../shared/pagination/pagination.utils.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPaginated(params: {
    page: number;
    limit: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const { skip, take, page: p, limit: l } = getPagination(params.page, params.limit);

    const andConditions: Prisma.UserWhereInput[] = [
      { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] },
    ];
    if (params.role) {
      andConditions.push({ role: params.role as any });
    }
    if (params.isActive !== undefined) {
      andConditions.push({ isActive: params.isActive });
    }
    if (params.search?.trim()) {
      andConditions.push({
        OR: [
          { email: { contains: params.search.trim(), mode: 'insensitive' } },
          { name: { contains: params.search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = { AND: andConditions };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page: p, limit: l };
  }

  async findById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
      },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(id: string, data: { name?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        updatedAt: true,
      },
    });
  }
}
