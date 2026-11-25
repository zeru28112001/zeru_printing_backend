import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to MongoDB via Prisma Client');
    } catch (error) {
      this.logger.error(
        `Failed to connect to MongoDB: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.seedDefaultsIfEmpty();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma Client disconnected');
  }

  /**
   * Initializes essential root admin and basic settings if completely empty
   */
  async seedDefaultsIfEmpty(): Promise<void> {
    try {
      const adminCount = await this.user.count({ where: { role: UserRole.SUPER_ADMIN } });
      if (adminCount === 0) {
        const passwordHash = await bcrypt.hash('281120', 10);
        await this.user.create({
          data: {
            email: 'admin@zeruprinting.com',
            name: 'Zeru Master Admin',
            passwordHash,
            role: UserRole.SUPER_ADMIN,
          },
        });
        this.logger.log('🌱 Seeded default Super Admin (admin@zeruprinting.com / PIN: 281120)');
      }

      const settingsCount = await this.storeSystemSettings.count();
      if (settingsCount === 0) {
        await this.storeSystemSettings.create({
          data: {
            storeName: 'Zeru Printing Service',
            depositPercentage: 33.33,
            minOrderQuantity: 1,
            standardLeadDays: 3,
            rushLeadDays: 1,
            rushFeePercentage: 20.0,
            contactPhone: '09798765432',
            contactViber: '09798765432',
            contactTelegram: 'zeru_printing',
          },
        });
        this.logger.log('🌱 Seeded store system settings');
      }
    } catch (seedErr) {
      this.logger.warn(`Auto-seed note: ${seedErr instanceof Error ? seedErr.message : seedErr}`);
    }
  }
}
