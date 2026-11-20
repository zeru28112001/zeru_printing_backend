import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  ParseBooleanPipe,
  ParseNumberPipe,
  ParseOptionalFloatPipe,
  ParseStringPipe,
} from '../../common/pipes/index.js';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
import { ProductService } from './product.service.js';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  // ==========================================
  // Public Routes (Customer Catalog & Customizer)
  // ==========================================

  @Get()
  @ApiOperation({ summary: 'List active products for customer catalog & customizer' })
  @ApiQuery({ name: 'gsm', required: false, type: Number })
  @ApiQuery({ name: 'sizingType', required: false, enum: ['SIZED', 'FREE_SIZE'] })
  listActive(
    @Query('gsm', new ParseOptionalFloatPipe()) gsm?: number,
    @Query('sizingType') sizingType?: 'SIZED' | 'FREE_SIZE',
  ) {
    return this.service.listActive({ gsm, sizingType });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail by ID' })
  findById(@Param('id', ParseStringPipe) id: string) {
    return this.service.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product detail by slug' })
  findBySlug(@Param('slug', ParseStringPipe) slug: string) {
    return this.service.findBySlug(slug);
  }

  // ==========================================
  // Admin Routes (Protected)
  // ==========================================

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin list all products with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  listAdmin(
    @Query('page', new ParseNumberPipe('page')) page: number = 1,
    @Query('limit', new ParseNumberPipe('limit')) limit: number = 20,
    @Query('search') search?: string,
    @Query('isActive', new ParseBooleanPipe('isActive')) isActive?: boolean,
  ) {
    return this.service.listAdmin({ page, limit, search, isActive });
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new t-shirt product' })
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update t-shirt product' })
  update(
    @Param('id', ParseStringPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch('admin/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle product active/inactive' })
  toggleStatus(
    @Param('id', ParseStringPipe) id: string,
    @Body('isActive', new ParseBooleanPipe('isActive')) isActive: boolean,
  ) {
    return this.service.toggleStatus(id, isActive);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft delete a product' })
  delete(@Param('id', ParseStringPipe) id: string) {
    return this.service.delete(id);
  }
}
