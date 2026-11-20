import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  DATABASE_URL: z.string().default('mongodb+srv://user:pass@cluster.mongodb.net/zeru_printing?retryWrites=true&w=majority'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters').default('zeru_printing_super_secret_jwt_key_2026'),
  JWT_EXPIRES_IN: z.string().default('30d'),
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(120),

  // Google Drive Integration (Optional, falls back to local disk storage in /uploads)
  GOOGLE_DRIVE_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_DRIVE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),

  // Telegram Bot Alerts (Optional)
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Initial Admin Secret PIN / Password
  ADMIN_DEFAULT_PIN: z.string().default('281120'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    throw new Error('Environment validation failed');
  }
  return result.data;
}
