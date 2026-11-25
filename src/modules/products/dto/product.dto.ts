import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductColorDto {
  @ApiProperty({ example: 'White' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#FFFFFF' })
  @IsString()
  @IsNotEmpty()
  hex: string;

  @ApiPropertyOptional({ example: 'https://example.com/mockups/white-front.png' })
  @IsString()
  @IsOptional()
  frontImage?: string;

  @ApiPropertyOptional({ example: 'https://example.com/mockups/white-back.png' })
  @IsString()
  @IsOptional()
  backImage?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;
}

export class SizeChartEntryDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiPropertyOptional({ example: 19.5, description: 'Shoulder width in inches' })
  @IsNumber()
  @IsOptional()
  shoulder?: number;

  @ApiPropertyOptional({ example: 42.0, description: 'Chest width in inches' })
  @IsNumber()
  @IsOptional()
  chest?: number;

  @ApiPropertyOptional({ example: 28.5, description: 'Body length in inches' })
  @IsNumber()
  @IsOptional()
  length?: number;

  @ApiPropertyOptional({ example: 9.0, description: 'Sleeve length in inches' })
  @IsNumber()
  @IsOptional()
  sleeve?: number;

  @ApiPropertyOptional({ example: 7.5, description: 'Neck opening width in inches' })
  @IsNumber()
  @IsOptional()
  neckWidth?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Heavyweight Premium Cotton Tee' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'heavyweight-premium-cotton-tee' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: '240 GSM 100% combed cotton with structured drape.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 240, description: 'Fabric GSM (weight)' })
  @IsNumber()
  @Min(50)
  gsm: number;

  @ApiProperty({ example: '100% Combed Compact Cotton' })
  @IsString()
  @IsNotEmpty()
  fabricType: string;

  @ApiPropertyOptional({ example: 18000, description: 'Base blank shirt price in MMK' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({ example: 18000, description: 'Base blank shirt price in MMK' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  basePriceMmk?: number;

  @ApiPropertyOptional({ enum: ['SIZED', 'FREE_SIZE'], default: 'SIZED' })
  @IsEnum(['SIZED', 'FREE_SIZE'])
  @IsOptional()
  sizingType?: 'SIZED' | 'FREE_SIZE';

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isCustomizable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isReadyToWear?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [ProductColorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  @IsOptional()
  colors?: ProductColorDto[];

  @ApiPropertyOptional({ type: [SizeChartEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeChartEntryDto)
  @IsOptional()
  sizeChart?: SizeChartEntryDto[];

  @ApiPropertyOptional({ example: ['S', 'M', 'L', 'XL', '2XL'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableSizes?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  featuredImage?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gsm?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fabricType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  basePriceMmk?: number;

  @ApiPropertyOptional({ enum: ['SIZED', 'FREE_SIZE'] })
  @IsEnum(['SIZED', 'FREE_SIZE'])
  @IsOptional()
  sizingType?: 'SIZED' | 'FREE_SIZE';

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isCustomizable?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isReadyToWear?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [ProductColorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  @IsOptional()
  colors?: ProductColorDto[];

  @ApiPropertyOptional({ type: [SizeChartEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeChartEntryDto)
  @IsOptional()
  sizeChart?: SizeChartEntryDto[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableSizes?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  featuredImage?: string;
}
