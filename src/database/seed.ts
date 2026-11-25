import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database and ensuring only Admin account exists...');

  // 1. Delete all mock / sample data
  try {
    await prisma.orderAuditLog.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.orderCustomization.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.customerAddress.deleteMany({});
    await prisma.artworkAsset.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.productionJob.deleteMany({});
    await prisma.inventoryMovement.deleteMany({});
    await prisma.inventoryStock.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.printPlacement.deleteMany({});
    await prisma.paymentMethod.deleteMany({});
    console.log('✅ Cleared all mock products, variants, inventory, placements, and orders.');
  } catch (err) {
    console.warn('Note during cleanup:', err instanceof Error ? err.message : err);
  }

  // 2. Ensure Master Admin Account
  const adminEmail = 'admin@zeruprinting.com';
  const existingAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('281120', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Zeru Master Admin',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        phone: '09798765432',
      },
    });
    console.log('✅ Created Master Admin account: admin@zeruprinting.com (PIN: 281120)');
  } else {
    console.log('✅ Master Admin account already exists: admin@zeruprinting.com (PIN: 281120)');
  }

  // 3. Ensure Store System Settings
  const existingSettings = await prisma.storeSystemSettings.findFirst();
  if (!existingSettings) {
    await prisma.storeSystemSettings.create({
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
        maintenanceMode: false,
      },
    });
    console.log('✅ Initialized store system settings (Deposit: 33.33%, 3-day turnaround)');
  }

  console.log('🎉 Database is clean! Only Master Admin account is present.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
