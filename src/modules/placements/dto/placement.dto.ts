import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlacementDto {
  @ApiProperty({ example: 'full_front' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Full Front' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['FRONT', 'BACK'], example: 'FRONT' })
  @IsEnum(['FRONT', 'BACK'])
  side: 'FRONT' | 'BACK';

  @ApiPropertyOptional({ default: false, description: 'True for Full Front and Full Back' })
  @IsBoolean()
  @IsOptional()
  isDefaultShown?: boolean;

  @ApiProperty({ example: 12.0, description: 'Default print width in inches' })
  @IsNumber()
  @Min(0.5)
  defaultWidthInches: number;

  @ApiProperty({ example: 14.0, description: 'Default print height in inches' })
  @IsNumber()
  @Min(0.5)
  defaultHeightInches: number;

  @ApiProperty({ example: 7000, description: 'DTF printing cost in MMK' })
  @IsNumber()
  @Min(0)
  baseCostMmk: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdatePlacementDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ['FRONT', 'BACK'] })
  @IsEnum(['FRONT', 'BACK'])
  @IsOptional()
  side?: 'FRONT' | 'BACK';

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefaultShown?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  defaultWidthInches?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  defaultHeightInches?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  baseCostMmk?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
