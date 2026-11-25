import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  PaymentChannelType,
  PaymentStatus,
  PaymentType,
  PlacementSide,
} from '@prisma/client';
import { ApiResponse } from '../../common/http/api-response.js';
import { buildPaginationMeta } from '../../shared/pagination/pagination.utils.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { ProductRepository } from '../products/product.repository.js';
import { StorageService } from '../storage/storage.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import type { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto.js';
import { OrderRepository } from './order.repository.js';

@Injectable()
export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly storageService: StorageService,
    private readonly telegramService: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generates next sequential order number (e.g. ZP-20261120-0001)
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `ZP-${dateStr}-${randomSuffix}`;
  }

  async create(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const orderType =
      dto.orderType === 'READY_TO_WEAR'
        ? OrderType.READY_TO_WEAR
        : OrderType.CUSTOM_DTF;

    // Business Rule Check: No COD allowed for custom apparel!
    if (orderType === OrderType.CUSTOM_DTF && dto.paymentMethod === 'COD') {
      throw new BadRequestException(
        'Cash on Delivery (COD) is strictly NOT available for customized apparel. Please choose KBZPay or WavePay with a 1/3 deposit.',
      );
    }

    // 1. Upsert Customer Profile by Phone
    const normalizedPhone = dto.customer.phone.trim();
    let customer = await this.prisma.customer.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: dto.customer.name.trim(),
          phone: normalizedPhone,
          viberNumber: dto.customer.viberOrTelegram,
          telegramUsername: dto.customer.viberOrTelegram,
        },
      });
    } else {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: dto.customer.name.trim(),
          viberNumber: dto.customer.viberOrTelegram || customer.viberNumber,
        },
      });
    }

    // 2. Create/Find Customer Shipping Address
    const address = await this.prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        recipientName: dto.customer.name.trim(),
        phone: normalizedPhone,
        city: dto.customer.city?.trim() || 'Yangon',
        township: dto.customer.township?.trim() || 'General',
        detailedAddress: dto.customer.deliveryAddress.trim(),
        isDefault: true,
      },
    });

    // 3. Resolve Payment Method
    let paymentMethodCode = 'kbzpay_personal';
    if (dto.paymentMethod === 'WAVEPAY') {
      paymentMethodCode = 'wavepay_personal';
    } else if (dto.paymentMethod === 'COD') {
      paymentMethodCode = 'cash_on_pickup';
    }

    let paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { code: paymentMethodCode },
    });

    if (!paymentMethod) {
      paymentMethod = await this.prisma.paymentMethod.create({
        data: {
          code: paymentMethodCode,
          name: dto.paymentMethod === 'COD' ? 'Cash on Pickup' : dto.paymentMethod,
          accountName: 'Zeru Printing Service',
          accountNumber: '09798765432',
          type:
            dto.paymentMethod === 'COD'
              ? PaymentChannelType.CASH
              : PaymentChannelType.MOBILE_WALLET,
        },
      });
    }

    // 4. Calculate Item Totals & Validate Variants
    let totalAmountMmk = 0;
    const orderItemsToCreate: Array<{
      variantId: string;
      quantity: number;
      unitGarmentCostMmk: number;
      unitPrintCostMmk: number;
      itemTotalMmk: number;
      customizations: Array<{
        placementId: string;
        appliedWidthInches?: number;
        appliedHeightInches?: number;
        printCostMmk: number;
        mockupPreviewUrl?: string;
      }>;
    }> = [];

    for (const item of dto.items) {
      const product = await this.productRepository.findById(item.productId);
      const unitGarmentPrice = product?.basePriceMmk || 18000;

      // Ensure variant exists for selected color & size
      for (const sizeBreak of item.sizeBreakdown) {
        if (sizeBreak.quantity <= 0) continue;

        const sku = `ZP-${product?.gsm || 240}-${item.color.slice(0, 3).toUpperCase()}-${sizeBreak.size}`.toUpperCase();
        let variant = await this.prisma.productVariant.findFirst({
          where: {
            productId: item.productId,
            colorName: item.color,
            size: sizeBreak.size,
          },
        });

        if (!variant) {
          variant = await this.prisma.productVariant.create({
            data: {
              productId: item.productId,
              sku,
              colorName: item.color,
              colorHex: '#111111',
              size: sizeBreak.size,
              additionalCostMmk: 0,
            },
          });
          // Initialize stock
          await this.prisma.inventoryStock.create({
            data: {
              variantId: variant.id,
              quantityOnHand: 50,
              quantityReserved: 0,
            },
          });
        }

        // Sum print placements
        let unitPrintPrice = 0;
        const customizations: Array<{
          placementId: string;
          appliedWidthInches?: number;
          appliedHeightInches?: number;
          printCostMmk: number;
        }> = [];

        if (item.placements && item.placements.length > 0) {
          for (const pl of item.placements) {
            let placementRecord = await this.prisma.printPlacement.findFirst({
              where: { code: pl.placementCode },
            });
            if (!placementRecord) {
              placementRecord = await this.prisma.printPlacement.create({
                data: {
                  code: pl.placementCode,
                  name: pl.placementName,
                  side: pl.side === 'BACK' ? PlacementSide.BACK : PlacementSide.FRONT,
                  maxWidthInches: pl.widthInches || 12.0,
                  maxHeightInches: pl.heightInches || 14.0,
                  baseCostMmk: pl.costMmk || 7000,
                },
              });
            }

            const printCost = pl.costMmk || placementRecord.baseCostMmk || 0;
            unitPrintPrice += printCost;

            customizations.push({
              placementId: placementRecord.id,
              appliedWidthInches: pl.widthInches || (placementRecord.maxWidthInches ?? undefined),
              appliedHeightInches: pl.heightInches || (placementRecord.maxHeightInches ?? undefined),
              printCostMmk: printCost,
            });
          }
        }

        const itemTotal = (unitGarmentPrice + unitPrintPrice) * sizeBreak.quantity;
        totalAmountMmk += itemTotal;

        orderItemsToCreate.push({
          variantId: variant.id,
          quantity: sizeBreak.quantity,
          unitGarmentCostMmk: unitGarmentPrice,
          unitPrintCostMmk: unitPrintPrice,
          itemTotalMmk: itemTotal,
          customizations,
        });
      }
    }

    // 5. Calculate Deposit
    let depositRequiredMmk = 0;
    if (orderType === OrderType.CUSTOM_DTF) {
      depositRequiredMmk = Math.ceil((totalAmountMmk * (1 / 3)) / 500) * 500;
    } else if (orderType === OrderType.READY_TO_WEAR && dto.paymentMethod !== 'COD') {
      depositRequiredMmk = totalAmountMmk;
    }

    const orderNumber = await this.generateOrderNumber();

    // 6. Create Order with Items, Customizations and Payment Record
    const order = await this.repository.create({
      orderNumber,
      orderType,
      status: OrderStatus.PENDING_DEPOSIT,
      customer: { connect: { id: customer.id } },
      shippingAddress: { connect: { id: address.id } },
      subtotalMmk: totalAmountMmk,
      totalAmountMmk,
      depositRequiredMmk,
      depositPaidMmk: 0,
      customerNotes: dto.customer.notes,
      items: {
        create: orderItemsToCreate.map((oi) => ({
          variantId: oi.variantId,
          quantity: oi.quantity,
          unitGarmentCostMmk: oi.unitGarmentCostMmk,
          unitPrintCostMmk: oi.unitPrintCostMmk,
          itemTotalMmk: oi.itemTotalMmk,
          customizations: {
            create: oi.customizations.map((c) => ({
              placementId: c.placementId,
              appliedWidthInches: c.appliedWidthInches,
              appliedHeightInches: c.appliedHeightInches,
              printCostMmk: c.printCostMmk,
            })),
          },
        })),
      },
      payments: {
        create: [
          {
            paymentMethodId: paymentMethod.id,
            paymentType: PaymentType.DEPOSIT,
            amountMmk: depositRequiredMmk,
            slipImageUrl: dto.paymentSlipUrl,
            slipDriveFileId: dto.paymentSlipDriveFileId,
            slipDriveLink: dto.paymentSlipDriveWebViewLink,
            status: PaymentStatus.PENDING_VERIFICATION,
          },
        ],
      },
    });

    // Fire and forget Telegram Bot Alert
    const itemSummary = dto.items
      .map(
        (it) =>
          `• <b>${it.productName}</b> (${it.color}) - Sizes: ${it.sizeBreakdown
            .map((s) => `${s.size}:${s.quantity}`)
            .join(', ')}`,
      )
      .join('\n');

    this.telegramService
      .sendNewOrderAlert({
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        customerName: customer.name,
        phone: customer.phone,
        deliveryAddress: address.detailedAddress,
        viberOrTelegram: customer.viberNumber || undefined,
        totalAmountMmk: order.totalAmountMmk || 0,
        depositRequiredMmk: order.depositRequiredMmk || 0,
        paymentMethod: paymentMethod.name,
        paymentSlipUrl: dto.paymentSlipUrl || undefined,
        paymentSlipDriveWebViewLink: dto.paymentSlipDriveWebViewLink || undefined,
        itemSummary,
        placementsCount: dto.items.reduce(
          (acc, it) => acc + (it.placements?.length || 0),
          0,
        ),
      })
      .catch(() => {});

    return ApiResponse.created(order, 'Order placed successfully.');
  }

  async uploadFile(
    file: Express.Multer.File,
    subfolder: 'artworks' | 'slips',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploadResult = await this.storageService.uploadFile({
      buffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      subfolder,
    });

    return ApiResponse.created(uploadResult, 'File uploaded successfully.');
  }

  async trackOrder(orderNumber: string, phone: string) {
    const order = await this.repository.trackOrder(orderNumber, phone);
    if (!order) {
      throw new NotFoundException('Order not found matching this order number and phone number.');
    }
    return ApiResponse.success(order);
  }

  async findById(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return ApiResponse.success(order);
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.repository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return ApiResponse.success(order);
  }

  async listAdmin(params: {
    page: number;
    limit: number;
    status?: OrderStatus;
    orderType?: OrderType;
    search?: string;
  }) {
    const { items, total, page, limit } = await this.repository.listPaginated(params);
    const meta = buildPaginationMeta(total, page, limit, items.length);
    return ApiResponse.withPagination(items, meta);
  }

  async listPaginated(params: {
    page: number;
    limit: number;
    status?: OrderStatus;
    orderType?: OrderType;
    search?: string;
  }) {
    return this.listAdmin(params);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.repository.updateStatus(id, dto.status as OrderStatus, {
      depositPaidMmk: dto.depositPaidMmk,
      adminNotes: dto.adminNotes,
    });

    // If deposit is marked as confirmed, also update the deposit payment record
    if (dto.status === OrderStatus.DEPOSIT_CONFIRMED) {
      await this.prisma.payment.updateMany({
        where: { orderId: id, paymentType: PaymentType.DEPOSIT },
        data: { status: PaymentStatus.VERIFIED, verifiedAt: new Date() },
      });
    }

    return ApiResponse.success(updated, 'Order status updated successfully.');
  }
}
