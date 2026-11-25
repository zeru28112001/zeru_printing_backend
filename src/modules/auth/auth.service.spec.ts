import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let repository: AuthRepository;
  let jwtService: JwtService;
  let configService: ConfigService<any, true>;

  beforeEach(() => {
    repository = {
      findByEmail: vi.fn(),
      createUser: vi.fn(),
      findById: vi.fn(),
    } as unknown as AuthRepository;

    jwtService = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    } as unknown as JwtService;

    configService = {
      get: vi.fn().mockReturnValue('281120'),
    } as unknown as ConfigService<any, true>;

    service = new AuthService(repository, jwtService, configService);
  });

  describe('adminPinLogin', () => {
    it('should authenticate successfully with correct Master PIN', async () => {
      vi.spyOn(repository, 'findByEmail').mockResolvedValue({
        id: 'admin-1',
        email: 'admin@zeruprinting.com',
        name: 'Zeru Admin',
        role: UserRole.SUPER_ADMIN,
        passwordHash: 'hash',
        phone: '09798765432',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const res = await service.adminPinLogin({ pin: '281120' });
      expect(res.success).toBe(true);
      expect(res.data.accessToken).toBe('mock-jwt-token');
      expect(res.data.user.email).toBe('admin@zeruprinting.com');
    });

    it('should throw UnauthorizedException when PIN is incorrect', async () => {
      vi.spyOn(repository, 'findByEmail').mockResolvedValue({
        id: 'admin-1',
        email: 'admin@zeruprinting.com',
        name: 'Zeru Admin',
        role: UserRole.SUPER_ADMIN,
        passwordHash: await bcrypt.hash('281120', 10),
        phone: '09798765432',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await expect(service.adminPinLogin({ pin: 'wrong-pin' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should throw ConflictException if email is already taken', async () => {
      vi.spyOn(repository, 'findByEmail').mockResolvedValue({
        id: 'user-1',
        email: 'test@zeruprinting.com',
        name: 'Existing',
        role: UserRole.ADMIN,
        passwordHash: 'hash',
        phone: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      await expect(
        service.register({ email: 'test@zeruprinting.com', password: 'pass', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register new user with hashed password', async () => {
      vi.spyOn(repository, 'findByEmail').mockResolvedValue(null);
      vi.spyOn(repository, 'createUser').mockResolvedValue({
        id: 'user-new',
        email: 'new@zeruprinting.com',
        name: 'New User',
        role: UserRole.ADMIN,
        passwordHash: 'hashed',
        phone: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const res = await service.register({ email: 'new@zeruprinting.com', password: 'secretpassword', name: 'New User' });
      expect(res.success).toBe(true);
      expect(res.data?.user.id).toBe('user-new');
      expect(res.data?.accessToken).toBe('mock-jwt-token');
    });
  });
});
