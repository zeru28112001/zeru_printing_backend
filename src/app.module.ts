import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.schema.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OrderModule } from './modules/orders/order.module.js';
import { PlacementModule } from './modules/placements/placement.module.js';
import { ProductModule } from './modules/products/product.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { TelegramModule } from './modules/telegram/telegram.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') || 60,
          limit: config.get<number>('THROTTLE_LIMIT') || 120,
        },
      ],
    }),
    PrismaModule,
    StorageModule,
    TelegramModule,
    AuthModule,
    UsersModule,
    ProductModule,
    PlacementModule,
    OrderModule,
    SettingsModule,
  ],
})
export class AppModule {}
