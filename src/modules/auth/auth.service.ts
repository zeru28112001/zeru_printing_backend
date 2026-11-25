import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ApiResponse } from '../../common/http/api-response.js';
import type { EnvConfig } from '../../config/env.schema.js';
import { AuthRepository } from './auth.repository.js';
import type { AdminPinLoginDto, LoginDto, RegisterDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.repository.findByEmail(dto.email.toLowerCase());
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.repository.createUser({
      email: dto.email.toLowerCase(),
      passwordHash,
      name: dto.name || 'Store Staff',
      role: UserRole.ADMIN,
    });

    const token = this.generateToken(user.id);
    return ApiResponse.created(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken: token,
      },
      'User registered successfully.',
    );
  }

  async login(dto: LoginDto) {
    const user = await this.repository.findByEmail(dto.email.toLowerCase());
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.id);
    return ApiResponse.success(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken: token,
      },
      'Login successful.',
    );
  }

  /**
   * Fast Admin Login via Master PIN / Password
   */
  async adminPinLogin(dto: AdminPinLoginDto) {
    const configuredPin = this.configService.get('ADMIN_DEFAULT_PIN', { infer: true }) || '281120';
    
    // First check against environment variable PIN
    const isMasterPin = dto.pin === configuredPin;

    // Check if admin user exists in DB
    let adminUser = await this.repository.findByEmail('admin@zeruprinting.com');
    
    if (isMasterPin) {
      if (!adminUser) {
        const hash = await bcrypt.hash(configuredPin, 10);
        adminUser = await this.repository.createUser({
          email: 'admin@zeruprinting.com',
          name: 'Zeru Admin',
          passwordHash: hash,
          role: UserRole.ADMIN,
        });
      }
    } else if (adminUser) {
      const matches = await bcrypt.compare(dto.pin, adminUser.passwordHash);
      if (!matches) {
        throw new UnauthorizedException('Invalid Admin PIN');
      }
    } else {
      throw new UnauthorizedException('Invalid Admin PIN');
    }

    const token = this.generateToken(adminUser.id);
    return ApiResponse.success(
      {
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
        accessToken: token,
      },
      'Admin authentication successful.',
    );
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
