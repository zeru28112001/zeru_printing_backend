import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: UserRole;
  name?: string | null;
}
