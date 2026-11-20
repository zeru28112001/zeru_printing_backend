import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CustomerInfoDto {
  @ApiProperty({ example: 'Mg Mg' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '09798765432' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'Yangon' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Hledan / Kamayut' })
  @IsString()
  @IsOptional()
  township?: string;

  @ApiProperty({ example: 'No. 123, Pyay Road, Kamayut Township, Yangon' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiPropertyOptional({ example: '@mgmg_tg or Viber 09798765432' })
  @IsString()
  @IsOptional()
  viberOrTelegram?: string;

  @ApiPropertyOptional({ example: 'Please ensure colors are sharp and vibrant.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SizeQuantityDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class OrderPlacementDto {
  @ApiProperty({ example: 'full_front' })
  @IsString()
  @IsNotEmpty()
  placementCode: string;

  @ApiProperty({ example: 'Full Front' })
  @IsString()
  @IsNotEmpty()
  placementName: string;

  @ApiProperty({ example: 'FRONT' })
  @IsString()
  @IsNotEmpty()
  side: string;

  @ApiProperty({ example: 'https://example.com/artwork.png' })
  @IsString()
  @IsNotEmpty()
  artworkUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  artworkDriveFileId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  artworkDriveWebViewLink?: string;

  @ApiPropertyOptional({ example: 12.0 })
  @IsNumber()
  @IsOptional()
  widthInches?: number;

  @ApiPropertyOptional({ example: 14.0 })
  @IsNumber()
  @IsOptional()
  heightInches?: number;

  @ApiProperty({ example: 7000 })
  @IsNumber()
  @Min(0)
  costMmk: number;
}

export class OrderItemDto {
  @ApiProperty({ example: '67439abc123' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'Heavyweight Premium Cotton Tee' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiPropertyOptional({ example: 240 })
  @IsNumber()
  @IsOptional()
  gsm?: number;

  @ApiPropertyOptional({ example: '100% Combed Cotton' })
  @IsString()
  @IsOptional()
  fabricType?: string;

  @ApiProperty({ example: 'White' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ type: [SizeQuantityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeQuantityDto)
  sizeBreakdown: SizeQuantityDto[];

  @ApiPropertyOptional({ type: [OrderPlacementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderPlacementDto)
  @IsOptional()
  placements?: OrderPlacementDto[];
}

export class CreateOrderDto {
  @ApiPropertyOptional({ enum: ['CUSTOM', 'READY_TO_WEAR'], default: 'CUSTOM' })
  @IsEnum(['CUSTOM', 'READY_TO_WEAR'])
  @IsOptional()
  orderType?: 'CUSTOM' | 'READY_TO_WEAR';

  @ApiProperty({ type: CustomerInfoDto })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ enum: ['KBZPAY', 'WAVEPAY', 'COD'], example: 'KBZPAY' })
  @IsEnum(['KBZPAY', 'WAVEPAY', 'COD'])
  paymentMethod: 'KBZPAY' | 'WAVEPAY' | 'COD';

  @ApiPropertyOptional({ example: 'https://example.com/slip.jpg' })
  @IsString()
  @IsOptional()
  paymentSlipUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentSlipDriveFileId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentSlipDriveWebViewLink?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: [
      'PENDING_DEPOSIT',
      'DEPOSIT_CONFIRMED',
      'IN_PRODUCTION',
      'READY_FOR_DELIVERY',
      'COMPLETED',
      'CANCELLED',
    ],
  })
  @IsEnum([
    'PENDING_DEPOSIT',
    'DEPOSIT_CONFIRMED',
    'IN_PRODUCTION',
    'READY_FOR_DELIVERY',
    'COMPLETED',
    'CANCELLED',
  ])
  status:
    | 'PENDING_DEPOSIT'
    | 'DEPOSIT_CONFIRMED'
    | 'IN_PRODUCTION'
    | 'READY_FOR_DELIVERY'
    | 'COMPLETED'
    | 'CANCELLED';

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  depositPaidMmk?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
