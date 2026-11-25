import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'Zeru Printing Service' })
  @IsString()
  @IsOptional()
  storeName?: string;

  @ApiPropertyOptional({ example: 33.33, description: 'Deposit percentage required upfront for custom orders' })
  @IsNumber()
  @Min(10)
  @Max(100)
  @IsOptional()
  depositPercentage?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  minOrderQuantity?: number;

  @ApiPropertyOptional({ example: 3, description: 'Standard turnaround days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  standardLeadDays?: number;

  @ApiPropertyOptional({ example: 1, description: 'Rush turnaround days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  rushLeadDays?: number;

  @ApiPropertyOptional({ example: 20.0, description: 'Rush fee percentage' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  rushFeePercentage?: number;

  @ApiPropertyOptional({ example: '09798765432' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: '09798765432' })
  @IsString()
  @IsOptional()
  contactViber?: string;

  @ApiPropertyOptional({ example: 'zeru_printing' })
  @IsString()
  @IsOptional()
  contactTelegram?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telegramBotToken?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telegramAdminChatId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  googleDriveParentFolderId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  maintenanceMode?: boolean;
}
