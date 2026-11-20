import { Module } from '@nestjs/common';
import { ProductModule } from '../products/product.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { OrderController } from './order.controller.js';
import { OrderRepository } from './order.repository.js';
import { OrderService } from './order.service.js';

@Module({
  imports: [ProductModule, StorageModule, TelegramModule],
  controllers: [OrderController],
  providers: [OrderRepository, OrderService],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
