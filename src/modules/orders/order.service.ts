import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderStatus, OrderType } from '@prisma/client';
import { ApiResponse } from '../../common/http/api-response.js';
import { buildPaginationMeta } from '../../shared/pagination/pagination.utils.js';
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

    const orderType = dto.orderType || 'CUSTOM';

    // Business Rule Check: No COD allowed for custom apparel!
    if (orderType === 'CUSTOM' && dto.paymentMethod === 'COD') {
      throw new BadRequestException(
        'Cash on Delivery (COD) is strictly NOT available for customized apparel. Please choose KBZPay or WavePay with a 1/3 deposit.',
      );
    }

    // Calculate item totals and verify products
    let totalAmountMmk = 0;
    const processedItems = [];

    for (const item of dto.items) {
      const product = await this.productRepository.findById(item.productId);
      const unitGarmentPrice = product ? product.basePrice : 18000;

      // Sum quantities across sizes
      const totalQty = item.sizeBreakdown.reduce((acc, curr) => acc + curr.quantity, 0);
      if (totalQty <= 0) {
        throw new BadRequestException('Each item must have a quantity of at least 1');
      }

      // Sum DTF print placement costs
      const unitPrintPrice = (item.placements || []).reduce(
        (acc, curr) => acc + (curr.costMmk || 0),
        0,
      );

      const itemTotal = (unitGarmentPrice + unitPrintPrice) * totalQty;
      totalAmountMmk += itemTotal;

      processedItems.push({
        productId: item.productId,
        productName: item.productName,
        gsm: item.gsm,
        fabricType: item.fabricType,
        color: item.color,
        sizeBreakdown: item.sizeBreakdown,
        totalQuantity: totalQty,
        placements: item.placements || [],
        unitGarmentPriceMmk: unitGarmentPrice,
        unitPrintPriceMmk: unitPrintPrice,
        itemTotalMmk: itemTotal,
      });
    }

    // Calculate Deposit: 1/3 (~33%) for CUSTOM, 0 for READY_TO_WEAR COD
    let depositRequiredMmk = 0;
    if (orderType === 'CUSTOM') {
      // 1/3 rounded to nearest 500 MMK for cleaner payments
      depositRequiredMmk = Math.ceil((totalAmountMmk * (1 / 3)) / 500) * 500;
    } else if (orderType === 'READY_TO_WEAR' && dto.paymentMethod !== 'COD') {
      depositRequiredMmk = totalAmountMmk; // Full prepaid if not COD
    }

    const orderNumber = await this.generateOrderNumber();

    const order = await this.repository.create({
      orderNumber,
      orderType: orderType as OrderType,
      status: 'PENDING_DEPOSIT',
      customer: {
        name: dto.customer.name,
        phone: dto.customer.phone,
        city: dto.customer.city,
        township: dto.customer.township,
        deliveryAddress: dto.customer.deliveryAddress,
        viberOrTelegram: dto.customer.viberOrTelegram,
        notes: dto.customer.notes,
      },
      items: processedItems,
      totalAmountMmk,
      depositRequiredMmk,
      depositPaidMmk: 0,
      paymentMethod: dto.paymentMethod,
      paymentSlipUrl: dto.paymentSlipUrl,
      paymentSlipDriveFileId: dto.paymentSlipDriveFileId,
      paymentSlipDriveWebViewLink: dto.paymentSlipDriveWebViewLink,
    });

    // Send Telegram Bot Alert to Admin's phone
    const itemSummary = processedItems
      .map(
        (it) =>
          `• <b>${it.productName}</b> (${it.color}) - Qty: ${it.totalQuantity} (${it.sizeBreakdown
            .map((s) => `${s.size}:${s.quantity}`)
            .join(', ')})` +
          (it.placements.length > 0
            ? `\n  <i>Placements: ${it.placements.map((p) => p.placementName).join(', ')}</i>`
            : ''),
      )
      .join('\n');

    const placementsCount = processedItems.reduce((acc, it) => acc + it.placements.length, 0);

    // Fire and forget Telegram alert
    this.telegramService
      .sendNewOrderAlert({
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        customerName: order.customer.name,
        phone: order.customer.phone,
        deliveryAddress: order.customer.deliveryAddress,
        viberOrTelegram: order.customer.viberOrTelegram || undefined,
        totalAmountMmk: order.totalAmountMmk,
        depositRequiredMmk: order.depositRequiredMmk,
        paymentMethod: order.paymentMethod,
        paymentSlipUrl: order.paymentSlipUrl || undefined,
        paymentSlipDriveWebViewLink: order.paymentSlipDriveWebViewLink || undefined,
        itemSummary,
        placementsCount,
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

    return ApiResponse.success(uploadResult, 'File uploaded successfully.');
  }

  async trackOrder(orderNumber: string, phone: string) {
    const order = await this.repository.trackOrder(orderNumber.trim(), phone.trim());
    if (!order) {
      throw new NotFoundException(
        `Order not found. Please check your Order Number (#${orderNumber}) and Phone Number (${phone}).`,
      );
    }
    return ApiResponse.success(order, 'Order found.');
  }

  async listAdmin(params: {
    page: number;
    limit: number;
    status?: OrderStatus;
    orderType?: OrderType;
    search?: string;
  }) {
    const data = await this.repository.listPaginated(params);
    const meta = buildPaginationMeta(data.total, data.page, data.limit, data.items.length);
    return ApiResponse.withPagination(data.items, meta, 'Orders retrieved successfully.');
  }

  async findById(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID '${id}' not found`);
    }
    return ApiResponse.success(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Order with ID '${id}' not found`);
    }

    const updated = await this.repository.updateStatus(id, dto.status as OrderStatus, {
      depositPaidMmk: dto.depositPaidMmk,
      adminNotes: dto.adminNotes,
    });

    return ApiResponse.success(updated, `Order status updated to '${dto.status}'.`);
  }
}
