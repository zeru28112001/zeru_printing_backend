import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentChannelType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'kbzpay_personal' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'KBZPay (Personal)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: PaymentChannelType, default: PaymentChannelType.MOBILE_WALLET })
  @IsEnum(PaymentChannelType)
  @IsOptional()
  type?: PaymentChannelType;

  @ApiProperty({ example: 'U Kyaw Zayar Myo' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ example: '09798765432' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiPropertyOptional({ example: 'Kamayut Branch' })
  @IsString()
  @IsOptional()
  bankBranch?: string;

  @ApiPropertyOptional({ example: 'https://example.com/qr.png' })
  @IsString()
  @IsOptional()
  qrCodeImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  qrCodeDriveFileId?: string;

  @ApiPropertyOptional({ example: 'Please include your Order Number in the KBZPay transfer note' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: PaymentChannelType })
  @IsEnum(PaymentChannelType)
  @IsOptional()
  type?: PaymentChannelType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankBranch?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  qrCodeImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  qrCodeDriveFileId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
