import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from './order.service.js';
import { OrderRepository } from './order.repository.js';
import { ProductRepository } from '../products/product.repository.js';
import { StorageService } from '../storage/storage.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, OrderType, PaymentChannelType, PaymentStatus, PaymentType, PlacementSide } from '@prisma/client';

describe('OrderService', () => {
  let service: OrderService;
  let repository: OrderRepository;
  let productRepository: ProductRepository;
  let storageService: StorageService;
  let telegramService: TelegramService;
  let prisma: PrismaService;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      trackOrder: vi.fn(),
      listPaginated: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as OrderRepository;

    productRepository = {
      findById: vi.fn(),
    } as unknown as ProductRepository;

    storageService = {
      uploadFile: vi.fn(),
    } as unknown as StorageService;

    telegramService = {
      sendNewOrderAlert: vi.fn().mockResolvedValue(true),
    } as unknown as TelegramService;

    prisma = {
      customer: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      customerAddress: {
        create: vi.fn(),
      },
      paymentMethod: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      productVariant: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      inventoryStock: {
        create: vi.fn(),
      },
      printPlacement: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      payment: {
        updateMany: vi.fn(),
      },
    } as unknown as PrismaService;

    service = new OrderService(
      repository,
      productRepository,
      storageService,
      telegramService,
      prisma,
    );
  });

  describe('create', () => {
    it('should throw BadRequestException if order has no items', async () => {
      await expect(
        service.create({
          items: [],
          customer: { name: 'Ko Ko', phone: '09123456789', deliveryAddress: 'Yangon' },
          paymentMethod: 'KBZPAY',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should strictly reject Cash on Delivery (COD) for custom DTF apparel', async () => {
      await expect(
        service.create({
          orderType: 'CUSTOM',
          items: [
            {
              productId: 'prod-1',
              productName: 'Heavyweight Tee',
              color: 'Pitch Black',
              sizeBreakdown: [{ size: 'L', quantity: 2 }],
            },
          ],
          customer: { name: 'Ko Ko', phone: '09123456789', deliveryAddress: 'Yangon' },
          paymentMethod: 'COD',
        }),
      ).rejects.toThrow(/Cash on Delivery \(COD\) is strictly NOT available/);
    });

    it('should calculate 1/3 deposit, create order and trigger alert for valid custom order', async () => {
      // Mock Customer
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.customer, 'create').mockResolvedValue({
        id: 'cust-1',
        name: 'Ko Ko',
        phone: '09123456789',
        email: null,
        viberNumber: null,
        telegramUsername: null,
        totalSpentMmk: 0,
        ordersCount: 0,
        internalNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock Customer Address
      vi.spyOn(prisma.customerAddress, 'create').mockResolvedValue({
        id: 'addr-1',
        customerId: 'cust-1',
        recipientName: 'Ko Ko',
        phone: '09123456789',
        city: 'Yangon',
        township: 'Kamayut',
        detailedAddress: 'No. 123 Pyay Road',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock Payment Method
      vi.spyOn(prisma.paymentMethod, 'findUnique').mockResolvedValue({
        id: 'pm-kbz',
        code: 'kbzpay_personal',
        name: 'KBZPay (Personal)',
        type: PaymentChannelType.MOBILE_WALLET,
        accountName: 'Zeru Printing',
        accountNumber: '09798765432',
        bankBranch: null,
        qrCodeImageUrl: null,
        qrCodeDriveFileId: null,
        instructions: null,
        isActive: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock Product: 18,000 MMK base price
      vi.spyOn(productRepository, 'findById').mockResolvedValue({
        id: 'prod-1',
        name: '240 GSM Tee',
        basePriceMmk: 18000,
        basePrice: 18000,
        gsm: 240,
      } as any);

      // Mock Variant
      vi.spyOn(prisma.productVariant, 'findFirst').mockResolvedValue({
        id: 'var-1',
        productId: 'prod-1',
        sku: 'ZP-240-PIT-L',
        colorName: 'Pitch Black',
        colorHex: '#111111',
        size: 'L',
        frontBlankImage: null,
        backBlankImage: null,
        additionalCostMmk: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock Placement: Full Front 7,000 MMK
      vi.spyOn(prisma.printPlacement, 'findFirst').mockResolvedValue({
        id: 'pl-1',
        code: 'full_front',
        name: 'Full Front',
        side: PlacementSide.FRONT,
        isDefaultShown: true,
        maxWidthInches: 12.0,
        maxHeightInches: 14.0,
        baseCostMmk: 7000,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Total per item = 18,000 (garment) + 7,000 (print) = 25,000 MMK. Qty = 2.
      // Total amount = 50,000 MMK.
      // 1/3 deposit = 16,666.66 MMK -> rounded to nearest 500 = 17,000 MMK.

      vi.spyOn(repository, 'create').mockImplementation(async (data: any) => {
        return {
          id: 'order-1',
          orderNumber: 'ZP-20261124-1001',
          orderType: OrderType.CUSTOM_DTF,
          status: OrderStatus.PENDING_DEPOSIT,
          totalAmountMmk: data.totalAmountMmk,
          depositRequiredMmk: data.depositRequiredMmk,
          depositPaidMmk: 0,
          customer: { name: 'Ko Ko', phone: '09123456789' },
        } as any;
      });

      const res = await service.create({
        orderType: 'CUSTOM',
        items: [
          {
            productId: 'prod-1',
            productName: 'Heavyweight Tee',
            color: 'Pitch Black',
            sizeBreakdown: [{ size: 'L', quantity: 2 }],
            placements: [
              {
                placementCode: 'full_front',
                placementName: 'Full Front',
                side: 'FRONT',
                artworkUrl: 'https://example.com/art.png',
                costMmk: 7000,
              },
            ],
          },
        ],
        customer: {
          name: 'Ko Ko',
          phone: '09123456789',
          city: 'Yangon',
          township: 'Kamayut',
          deliveryAddress: 'No. 123 Pyay Road',
        },
        paymentMethod: 'KBZPAY',
      });

      expect(res.success).toBe(true);
      expect(res.data?.totalAmountMmk).toBe(50000);
      expect(res.data?.depositRequiredMmk).toBe(17000); // 1/3 rounded up to 500 MMK
      expect(telegramService.sendNewOrderAlert).toHaveBeenCalled();
    });
  });

  describe('trackOrder', () => {
    it('should return order when matching order number and phone exist', async () => {
      vi.spyOn(repository, 'trackOrder').mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ZP-20261124-1001',
        status: OrderStatus.IN_PRODUCTION,
      } as any);

      const res = await service.trackOrder('ZP-20261124-1001', '09123456789');
      expect(res.success).toBe(true);
      expect(res.data.id).toBe('order-1');
    });

    it('should throw NotFoundException if no order matches', async () => {
      vi.spyOn(repository, 'trackOrder').mockResolvedValue(null);
      await expect(service.trackOrder('ZP-INVALID', '09000000000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status and auto-verify deposit payment when DEPOSIT_CONFIRMED', async () => {
      vi.spyOn(repository, 'findById').mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PENDING_DEPOSIT,
      } as any);

      vi.spyOn(repository, 'updateStatus').mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.DEPOSIT_CONFIRMED,
        depositPaidMmk: 17000,
      } as any);

      const res = await service.updateStatus('order-1', {
        status: 'DEPOSIT_CONFIRMED',
        depositPaidMmk: 17000,
      });

      expect(res.success).toBe(true);
      expect(res.data.status).toBe(OrderStatus.DEPOSIT_CONFIRMED);
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { orderId: 'order-1', paymentType: PaymentType.DEPOSIT },
        data: expect.objectContaining({ status: PaymentStatus.VERIFIED }),
      });
    });
  });
});
