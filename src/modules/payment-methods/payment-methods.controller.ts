import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './dto/payment-method.dto.js';
import { PaymentMethodsService } from './payment-methods.service.js';

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get active payment methods for customer checkout' })
  getPublicPaymentMethods() {
    return this.service.getPublicMethods();
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all payment methods (active & inactive) for admin' })
  getAllPaymentMethods() {
    return this.service.getAllMethods();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment method by ID' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new payment method (Admin)' })
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update payment method details, active toggle, or order (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a payment method (Admin)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
