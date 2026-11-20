import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../config/env.schema.js';

export interface TelegramOrderPayload {
  orderNumber: string;
  orderType: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  viberOrTelegram?: string;
  totalAmountMmk: number;
  depositRequiredMmk: number;
  paymentMethod: string;
  paymentSlipUrl?: string;
  paymentSlipDriveWebViewLink?: string;
  itemSummary: string;
  placementsCount: number;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken?: string;
  private readonly chatId?: string;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN', { infer: true });
    this.chatId = this.configService.get('TELEGRAM_CHAT_ID', { infer: true });

    if (this.botToken && this.chatId) {
      this.logger.log('✅ Telegram Bot alerts initialized');
    } else {
      this.logger.log('ℹ️ Telegram Bot credentials not provided. Order alerts will be logged to console.');
    }
  }

  async sendNewOrderAlert(payload: TelegramOrderPayload): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      this.logger.log(`[Telegram Simulation] New Order #${payload.orderNumber} by ${payload.customerName} - Total: ${payload.totalAmountMmk.toLocaleString()} MMK (Deposit Due: ${payload.depositRequiredMmk.toLocaleString()} MMK)`);
      return false;
    }

    const message = [
      `🚨 <b>NEW ORDER RECEIVED!</b>`,
      ``,
      `🔖 <b>Order ID:</b> <code>#${payload.orderNumber}</code>`,
      `📦 <b>Type:</b> ${payload.orderType === 'CUSTOM' ? '🎨 Custom DTF Print' : '👕 Ready-to-Wear'}`,
      ``,
      `👤 <b>Customer:</b> ${payload.customerName}`,
      `📞 <b>Phone:</b> <code>${payload.phone}</code>`,
      payload.viberOrTelegram ? `💬 <b>Viber/TG:</b> ${payload.viberOrTelegram}` : null,
      `📍 <b>Address:</b> ${payload.deliveryAddress}`,
      ``,
      `👕 <b>Garment & Items:</b>`,
      payload.itemSummary,
      ``,
      `💰 <b>Total Amount:</b> <b>${payload.totalAmountMmk.toLocaleString()} MMK</b>`,
      payload.depositRequiredMmk > 0
        ? `💳 <b>Deposit Due (1/3):</b> <b>${payload.depositRequiredMmk.toLocaleString()} MMK</b>`
        : `🚚 <b>Payment:</b> Cash on Delivery (COD)`,
      `🏦 <b>Payment Method:</b> ${payload.paymentMethod}`,
      payload.paymentSlipDriveWebViewLink
        ? `🔗 <a href="${payload.paymentSlipDriveWebViewLink}">📄 View Deposit Slip on Google Drive</a>`
        : payload.paymentSlipUrl
        ? `🔗 <a href="${payload.paymentSlipUrl}">📄 View Deposit Slip</a>`
        : `⚠️ <i>No payment slip uploaded</i>`,
      ``,
      `🕒 <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Yangon' })} (Myanmar Time)`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Telegram API error: ${errorText}`);
        return false;
      }

      this.logger.log(`✅ Sent Telegram notification for order #${payload.orderNumber}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send Telegram message: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }
}
