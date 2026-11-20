import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      console.log('✅ Connected to MongoDB via Prisma');
    } catch (error) {
      console.warn('⚠️ Could not connect to MongoDB yet (check DATABASE_URL in .env):', error instanceof Error ? error.message : error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
