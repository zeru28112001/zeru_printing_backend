import { describe, it, expect, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  function createMockContext(user?: any) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access if no roles are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow SUPER_ADMIN even when only ADMIN is required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({
      id: 'admin-1',
      role: UserRole.SUPER_ADMIN,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow matching ADMIN role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({
      id: 'admin-2',
      role: UserRole.ADMIN,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny unauthorized roles with ForbiddenException', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({
      id: 'staff-1',
      role: UserRole.SALES,
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
