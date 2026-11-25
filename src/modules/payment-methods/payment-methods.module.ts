import { Module } from '@nestjs/common';
import { PaymentMethodsController } from './payment-methods.controller.js';
import { PaymentMethodsRepository } from './payment-methods.repository.js';
import { PaymentMethodsService } from './payment-methods.service.js';

@Module({
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsRepository, PaymentMethodsService],
  exports: [PaymentMethodsRepository, PaymentMethodsService],
})
export class PaymentMethodsModule {}
