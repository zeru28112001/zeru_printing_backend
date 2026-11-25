import {
  Body,
  Controller,
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
import { ParseStringPipe } from '../../common/pipes/index.js';
import { CreatePlacementDto, UpdatePlacementDto } from './dto/placement.dto.js';
import { PlacementService } from './placement.service.js';

@ApiTags('placements')
@Controller('placements')
export class PlacementController {
  constructor(private readonly service: PlacementService) {}

  // Public endpoint for customizer studio
  @Get()
  @ApiOperation({ summary: 'List active DTF print placement zones' })
  listActive() {
    return this.service.listActive();
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin list all print placements including inactive' })
  listAll() {
    return this.service.listAll();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin create a new print placement zone' })
  create(@Body() dto: CreatePlacementDto) {
    return this.service.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin update placement pricing (MMK) and dimensions' })
  update(
    @Param('id', ParseStringPipe) id: string,
    @Body() dto: UpdatePlacementDto,
  ) {
    return this.service.update(id, dto);
  }
}
