import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to MongoDB via Prisma');
      await this.seedDefaultsIfEmpty();
    } catch (error) {
      this.logger.warn(
        `⚠️ Could not connect to MongoDB yet (check DATABASE_URL in .env): ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Automatically initializes essential data in MongoDB if the database is newly created
   */
  async seedDefaultsIfEmpty(): Promise<void> {
    try {
      // 1. Check & Seed Admin User
      const adminCount = await this.user.count({ where: { role: 'ADMIN' } });
      if (adminCount === 0) {
        const passwordHash = await bcrypt.hash('281120', 10);
        await this.user.create({
          data: {
            email: 'admin@zeruprinting.com',
            name: 'Zeru Admin',
            passwordHash,
            role: 'ADMIN',
          },
        });
        this.logger.log('🌱 Seeded default Admin user (admin@zeruprinting.com / PIN: 281120)');
      }

      // 2. Check & Seed Store Settings
      const settingsCount = await this.storeSettings.count();
      if (settingsCount === 0) {
        await this.storeSettings.create({
          data: {
            depositPercentage: 33.33,
            kbzPayAccountName: 'Zeru Printing Service',
            kbzPayPhone: '09798765432',
            wavePayAccountName: 'Zeru Printing Service',
            wavePayPhone: '09798765432',
            adminContactPhone: '09798765432',
            adminViberPhone: '09798765432',
            adminTelegramUsername: 'zeru_printing',
          },
        });
        this.logger.log('🌱 Seeded default store payment settings (KBZPay, WavePay)');
      }

      // 3. Check & Seed Print Placements
      const placementCount = await this.printPlacement.count();
      if (placementCount === 0) {
        const placements = [
          {
            code: 'full_front',
            name: 'Full Front',
            side: 'FRONT' as const,
            isDefaultShown: true,
            defaultWidthInches: 12.0,
            defaultHeightInches: 14.0,
            baseCostMmk: 7000,
            sortOrder: 1,
          },
          {
            code: 'full_back',
            name: 'Full Back',
            side: 'BACK' as const,
            isDefaultShown: true,
            defaultWidthInches: 12.0,
            defaultHeightInches: 14.0,
            baseCostMmk: 7000,
            sortOrder: 2,
          },
          {
            code: 'left_chest',
            name: 'Left Chest',
            side: 'FRONT' as const,
            isDefaultShown: false,
            defaultWidthInches: 3.5,
            defaultHeightInches: 3.5,
            baseCostMmk: 2500,
            sortOrder: 3,
          },
          {
            code: 'center_chest',
            name: 'Center Chest',
            side: 'FRONT' as const,
            isDefaultShown: false,
            defaultWidthInches: 8.0,
            defaultHeightInches: 4.0,
            baseCostMmk: 4500,
            sortOrder: 4,
          },
          {
            code: 'sleeves_left',
            name: 'Left Sleeve',
            side: 'FRONT' as const,
            isDefaultShown: false,
            defaultWidthInches: 3.5,
            defaultHeightInches: 3.5,
            baseCostMmk: 2500,
            sortOrder: 5,
          },
          {
            code: 'sleeves_right',
            name: 'Right Sleeve',
            side: 'FRONT' as const,
            isDefaultShown: false,
            defaultWidthInches: 3.5,
            defaultHeightInches: 3.5,
            baseCostMmk: 2500,
            sortOrder: 6,
          },
          {
            code: 'back_collar',
            name: 'Back Collar',
            side: 'BACK' as const,
            isDefaultShown: false,
            defaultWidthInches: 3.5,
            defaultHeightInches: 2.5,
            baseCostMmk: 2500,
            sortOrder: 7,
          },
          {
            code: 'upper_back',
            name: 'Upper Back',
            side: 'BACK' as const,
            isDefaultShown: false,
            defaultWidthInches: 10.0,
            defaultHeightInches: 4.0,
            baseCostMmk: 5000,
            sortOrder: 8,
          },
          {
            code: 'neck_label',
            name: 'Inside Neck Label',
            side: 'BACK' as const,
            isDefaultShown: false,
            defaultWidthInches: 2.5,
            defaultHeightInches: 2.5,
            baseCostMmk: 1500,
            sortOrder: 9,
          },
        ];

        for (const pl of placements) {
          await this.printPlacement.create({ data: pl });
        }
        this.logger.log('🌱 Seeded 9 DTF print placements');
      }

      // 4. Check & Seed T-Shirt Products
      const productCount = await this.product.count({ where: { deletedAt: null } });
      if (productCount === 0) {
        const products = [
          {
            name: 'Heavyweight Premium Cotton Tee',
            slug: 'heavyweight-premium-cotton-tee-240gsm',
            description:
              '240 GSM premium combed compact cotton. Substantial feel, zero see-through, perfect for sharp DTF sticker application.',
            gsm: 240,
            fabricType: '100% Combed Compact Cotton',
            basePrice: 18000,
            sizingType: 'SIZED' as const,
            isCustomizable: true,
            isReadyToWear: false,
            availableSizes: ['S', 'M', 'L', 'XL', '2XL'],
            colors: [
              { name: 'Pure White', hex: '#FFFFFF', inStock: true },
              { name: 'Pitch Black', hex: '#111111', inStock: true },
              { name: 'Charcoal Grey', hex: '#2E2E2E', inStock: true },
              { name: 'Natural Sand', hex: '#E2D7C5', inStock: true },
            ],
            sizeChart: [
              { size: 'S', shoulder: 18.5, chest: 40.0, length: 27.5, sleeve: 8.5, neckWidth: 7.0 },
              { size: 'M', shoulder: 19.5, chest: 42.0, length: 28.5, sleeve: 9.0, neckWidth: 7.5 },
              { size: 'L', shoulder: 20.5, chest: 44.0, length: 29.5, sleeve: 9.5, neckWidth: 7.5 },
              { size: 'XL', shoulder: 21.5, chest: 46.0, length: 30.5, sleeve: 10.0, neckWidth: 8.0 },
              { size: '2XL', shoulder: 22.5, chest: 48.0, length: 31.5, sleeve: 10.5, neckWidth: 8.5 },
            ],
          },
          {
            name: 'Ultra-Heavy Vintage Streetwear Tee',
            slug: 'ultra-heavy-vintage-streetwear-tee-290gsm',
            description:
              '290 GSM heavy duty cotton with ribbed collar and reinforced shoulder seams. Authentic modern boxy drape.',
            gsm: 290,
            fabricType: '100% Heavy Combed Cotton',
            basePrice: 22000,
            sizingType: 'SIZED' as const,
            isCustomizable: true,
            isReadyToWear: false,
            availableSizes: ['M', 'L', 'XL', '2XL'],
            colors: [
              { name: 'Vintage White', hex: '#F8F6F0', inStock: true },
              { name: 'Washed Black', hex: '#1C1C1E', inStock: true },
              { name: 'Midnight Navy', hex: '#14213D', inStock: true },
            ],
            sizeChart: [
              { size: 'M', shoulder: 20.5, chest: 44.0, length: 29.0, sleeve: 9.5, neckWidth: 7.5 },
              { size: 'L', shoulder: 21.5, chest: 46.0, length: 30.0, sleeve: 10.0, neckWidth: 8.0 },
              { size: 'XL', shoulder: 22.5, chest: 48.0, length: 31.0, sleeve: 10.5, neckWidth: 8.5 },
              { size: '2XL', shoulder: 23.5, chest: 50.0, length: 32.0, sleeve: 11.0, neckWidth: 8.5 },
            ],
          },
          {
            name: 'Air Layer Boxy Oversized Tee',
            slug: 'air-layer-boxy-oversized-tee-350gsm',
            description:
              '350 GSM structural air-layer scuba cotton. Premium futuristic drape, wrinkle resistant, dropped shoulders with clean wide silhouette.',
            gsm: 350,
            fabricType: 'Double-Knit Air Layer Cotton Blend',
            basePrice: 28000,
            sizingType: 'FREE_SIZE' as const,
            isCustomizable: true,
            isReadyToWear: false,
            availableSizes: ['Free Size'],
            colors: [
              { name: 'Clean White', hex: '#FFFFFF', inStock: true },
              { name: 'Deep Onyx Black', hex: '#0B0B0B', inStock: true },
              { name: 'Oatmeal Heather', hex: '#DDD7CD', inStock: true },
            ],
            sizeChart: [
              { size: 'Free Size', shoulder: 23.5, chest: 50.0, length: 30.0, sleeve: 10.5, neckWidth: 8.0 },
            ],
          },
        ];

        for (const prod of products) {
          await this.product.create({ data: prod });
        }
        this.logger.log('🌱 Seeded 3 base T-Shirt products with size charts into MongoDB');
      }
    } catch (seedErr) {
      this.logger.warn(`Could not auto-seed database: ${seedErr instanceof Error ? seedErr.message : seedErr}`);
    }
  }
}
