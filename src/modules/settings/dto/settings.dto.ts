import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 33.33, description: 'Deposit percentage required upfront for custom orders' })
  @IsNumber()
  @Min(10)
  @Max(100)
  @IsOptional()
  depositPercentage?: number;

  @ApiPropertyOptional({ example: 'Zeru DTF Printing' })
  @IsString()
  @IsOptional()
  kbzPayAccountName?: string;

  @ApiPropertyOptional({ example: '09798765432' })
  @IsString()
  @IsOptional()
  kbzPayPhone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/kpay-qr.png' })
  @IsString()
  @IsOptional()
  kbzPayQrUrl?: string;

  @ApiPropertyOptional({ example: 'Zeru DTF Printing' })
  @IsString()
  @IsOptional()
  wavePayAccountName?: string;

  @ApiPropertyOptional({ example: '09798765432' })
  @IsString()
  @IsOptional()
  wavePayPhone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/wave-qr.png' })
  @IsString()
  @IsOptional()
  wavePayQrUrl?: string;

  @ApiPropertyOptional({ example: '09798765432' })
  @IsString()
  @IsOptional()
  adminContactPhone?: string;

  @ApiPropertyOptional({ example: '09798765432' })
  @IsString()
  @IsOptional()
  adminViberPhone?: string;

  @ApiPropertyOptional({ example: 'zeru_printing' })
  @IsString()
  @IsOptional()
  adminTelegramUsername?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telegramBotToken?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telegramChatId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  googleDriveFolderId?: string;
}
