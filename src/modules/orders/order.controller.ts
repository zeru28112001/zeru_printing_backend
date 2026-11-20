import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { OrderStatus, OrderType } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ParseNumberPipe, ParseStringPipe } from '../../common/pipes/index.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto.js';
import { OrderService } from './order.service.js';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  // ==========================================
  // Public Routes (Customer Order & Customizer)
  // ==========================================

  @Post()
  @ApiOperation({ summary: 'Submit a new customer order with deposit / COD' })
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Post('upload-artwork')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload customer DTF sticker artwork file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadArtwork(@UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFile(file, 'artworks');
  }

  @Post('upload-slip')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload customer KPay/WavePay deposit payment slip' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadSlip(@UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFile(file, 'slips');
  }

  @Get('track')
  @ApiOperation({ summary: 'Customer track order status by Order Number & Phone' })
  @ApiQuery({ name: 'orderNumber', example: 'ZP-20261120-1234' })
  @ApiQuery({ name: 'phone', example: '09798765432' })
  trackOrder(
    @Query('orderNumber', ParseStringPipe) orderNumber: string,
    @Query('phone', ParseStringPipe) phone: string,
  ) {
    return this.service.trackOrder(orderNumber, phone);
  }

  // ==========================================
  // Admin Routes (Protected)
  // ==========================================

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin list all customer orders' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'orderType', required: false, enum: ['CUSTOM', 'READY_TO_WEAR'] })
  @ApiQuery({ name: 'search', required: false })
  listAdmin(
    @Query('page', new ParseNumberPipe('page')) page: number = 1,
    @Query('limit', new ParseNumberPipe('limit')) limit: number = 20,
    @Query('status') status?: OrderStatus,
    @Query('orderType') orderType?: OrderType,
    @Query('search') search?: string,
  ) {
    return this.service.listAdmin({ page, limit, status, orderType, search });
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin get full order details by ID' })
  findById(@Param('id', ParseStringPipe) id: string) {
    return this.service.findById(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin update order status & deposit confirmation' })
  updateStatus(
    @Param('id', ParseStringPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }
}
