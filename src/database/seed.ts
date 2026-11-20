import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Zeru Printing Service database seed...');

  // 1. Seed Admin User
  const adminEmail = 'admin@zeruprinting.com';
  const existingAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('281120', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Zeru Admin',
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created (admin@zeruprinting.com / PIN: 281120)');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // 2. Seed Store Settings
  const existingSettings = await prisma.storeSettings.findFirst();
  if (!existingSettings) {
    await prisma.storeSettings.create({
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
    console.log('✅ Store settings initialized (Deposit: 33.33%, KBZPay/WavePay ready)');
  }

  // 3. Seed DTF Print Placements
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
    const existing = await prisma.printPlacement.findFirst({ where: { code: pl.code } });
    if (!existing) {
      await prisma.printPlacement.create({ data: pl });
      console.log(`✅ Seeded placement: ${pl.name} (${pl.side}) - ${pl.baseCostMmk} MMK`);
    }
  }

  // 4. Seed Standard T-Shirt Products
  const products = [
    {
      name: 'Heavyweight Premium Cotton Tee',
      slug: 'heavyweight-premium-cotton-tee-240gsm',
      description: '240 GSM premium combed compact cotton. Substantial feel, zero see-through, perfect for sharp DTF sticker application.',
      gsm: 240,
      fabricType: '100% Combed Compact Cotton',
      basePrice: 18000,
      sizingType: 'SIZED' as const,
      isCustomizable: true,
      isReadyToWear: false,
      availableSizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: [
        { name: 'White', hex: '#FFFFFF', inStock: true },
        { name: 'Pitch Black', hex: '#111111', inStock: true },
        { name: 'Charcoal Grey', hex: '#2E2E2E', inStock: true },
        { name: 'Natural Sand Beige', hex: '#E2D7C5', inStock: true },
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
      description: '290 GSM heavy duty cotton with ribbed collar and reinforced shoulder seams. Authentic modern boxy drape.',
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
      description: '350 GSM structural air-layer scuba cotton. Premium futuristic drape, wrinkle resistant, dropped shoulders with clean wide silhouette.',
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
    const existing = await prisma.product.findFirst({ where: { slug: prod.slug } });
    if (!existing) {
      await prisma.product.create({ data: prod });
      console.log(`✅ Seeded product: ${prod.name} (${prod.gsm} GSM) - ${prod.basePrice} MMK`);
    }
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
